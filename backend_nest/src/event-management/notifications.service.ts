import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  ServiceUnavailableException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, QueryFailedError } from 'typeorm';
import { EventNotificationEntity, NotificationStatus } from './entities/event-notification.entity';
import { NotificationRecipientEntity } from './entities/notification-recipient.entity';
import { ReminderLogEntity, ReminderResult, ReminderTrigger } from './entities/reminder-log.entity';
import { CreateNotificationDto } from './dto/notifications/create-notification.dto';
import { RemindNotificationDto } from './dto/notifications/remind-notification.dto';
import { EventEntity, EventStatus } from './entities/event.entity';
import { UserEntity } from '../users/entities/user.entity';
import { STATUS } from '../variables/CONST_STATUS';
import { NotificationService as CoreNotificationService } from '../notifycation/notification.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly tableExistsCache = new Map<string, boolean>();

  constructor(
    @InjectRepository(EventNotificationEntity, 'mssqlConnection')
    private readonly notificationRepo: Repository<EventNotificationEntity>,
    @InjectRepository(NotificationRecipientEntity, 'mssqlConnection')
    private readonly recipientRepo: Repository<NotificationRecipientEntity>,
    @InjectRepository(ReminderLogEntity, 'mssqlConnection')
    private readonly reminderLogRepo: Repository<ReminderLogEntity>,
    @InjectRepository(EventEntity, 'mssqlConnection')
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(UserEntity, 'mssqlConnection')
    private readonly userRepo: Repository<UserEntity>,
    @Inject(forwardRef(() => CoreNotificationService))
    private readonly coreNotificationService: CoreNotificationService,
  ) {}

  async createAndSend(eventId: string, dto: CreateNotificationDto, createdBy: string) {
    const event = await this.eventRepo.findOne({ where: { id: eventId, deletedAt: IsNull() } });

    if (!event) throw new NotFoundException({ code: 'EVT_001', message: 'Sự kiện không tồn tại' });
    if (event.status === EventStatus.CANCELLED) {
      throw new ConflictException({ code: 'EVT_002', message: 'Sự kiện đã bị hủy' });
    }
    if (!dto.recipients?.length) {
      throw new BadRequestException({ code: 'NTF_002', message: 'Không có phòng ban nào được chọn' });
    }

    if (dto.confirmationDeadline !== undefined) {
      event.confirmationDeadline = dto.confirmationDeadline ? new Date(dto.confirmationDeadline) : null;
    }
    if (dto.allowGuestReg !== undefined) {
      event.allowGuestReg = dto.allowGuestReg;
    }
    if (dto.maxTotalGuests !== undefined) {
      event.maxTotalGuests = dto.maxTotalGuests;
    }
    if (dto.confirmationDeadline && new Date(dto.confirmationDeadline).getTime() < Date.now()) {
      throw new BadRequestException({ code: 'NTF_003', message: 'Hạn xác nhận không hợp lệ' });
    }
    await this.eventRepo.save(event);

    const [hasNotificationTable, hasRecipientTable] = await Promise.all([
      this.hasTable('event_notifications'),
      this.hasTable('notification_recipients'),
    ]);

    if (!hasNotificationTable) {
      throw new ServiceUnavailableException({
        code: 'NTF_TABLE_MISSING',
        message:
          'Bảng event_notifications chưa tồn tại. Vui lòng cập nhật schema/migration cho module Event Notifications.',
      });
    }

    if (!hasRecipientTable) {
      throw new ServiceUnavailableException({
        code: 'NTF_RECIPIENT_TABLE_MISSING',
        message:
          'Bảng notification_recipients chưa tồn tại. Vui lòng cập nhật schema/migration cho module Event Notifications.',
      });
    }

    try {
      const notification = this.notificationRepo.create({
        id: uuidv4(),
        eventId,
        title: dto.title,
        content: dto.content,
        sendType: dto.sendType,
        reminderEnabled: dto.reminderEnabled ?? false,
        reminderDaysBefore: dto.reminderEnabled ? dto.reminderDaysBefore ?? 1 : null,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        createdAt: new Date(),
        createdBy,
      });
      const saved = await this.notificationRepo.save(notification);

      const recipients = dto.recipients.map((r) =>
        this.recipientRepo.create({
          id: uuidv4(),
          notificationId: saved.id,
          departmentId: r.departmentId,
          maxGuests: r.maxGuests ?? 0,
          isRelatedFunction: r.isRelatedFunction ?? true,
          createdAt: new Date(),
        }),
      );
      await this.recipientRepo.save(recipients);
      await this.pushToSystemNotificationInbox({
        event,
        eventNotification: saved,
        recipients,
        senderId: createdBy,
      });

      return {
        success: true,
        data: {
          id: saved.id,
          title: saved.title,
          status: saved.status,
          sentAt: saved.sentAt,
          recipientsCount: recipients.length,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to create notification for eventId=${eventId}`, error?.stack || error);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        const sqlErrorNumber = error?.driverError?.number;
        if (sqlErrorNumber === 2627 || sqlErrorNumber === 2601) {
          throw new ConflictException({
            code: 'NTF_DUPLICATE_RECIPIENT',
            message: 'Danh sách phòng ban nhận thông báo đang bị trùng.',
          });
        }
        if (sqlErrorNumber === 208) {
          throw new ServiceUnavailableException({
            code: 'NTF_SCHEMA_MISSING',
            message:
              'Thiếu bảng dữ liệu Event Notifications (event_notifications / notification_recipients). Vui lòng chạy script khởi tạo schema.',
          });
        }
      }

      throw new ServiceUnavailableException({
        code: 'NTF_CREATE_FAILED',
        message: 'Không thể lưu thông báo sự kiện do lỗi máy chủ. Vui lòng kiểm tra log backend.',
      });
    }
  }

  async findByEvent(eventId: string) {
    const notifications = await this.notificationRepo.find({
      where: { eventId },
      order: { createdAt: 'DESC' },
    });
    return { success: true, data: notifications };
  }

  async findOne(id: string) {
    const hasRecipientTable = await this.hasTable('notification_recipients');
    const notification = await this.notificationRepo.findOne({
      where: { id },
      relations: hasRecipientTable ? ['recipients'] : [],
    });

    if (!notification) throw new NotFoundException({ code: 'NTF_001', message: 'Thông báo không tồn tại' });
    return { success: true, data: notification };
  }

  async recall(id: string) {
    const notification = await this.findOneOrFail(id);
    notification.status = NotificationStatus.RECALLED;
    const saved = await this.notificationRepo.save(notification);
    return { success: true, data: { id: saved.id, status: saved.status } };
  }

  async sendReminder(id: string, dto: RemindNotificationDto, triggeredBy: ReminderTrigger = ReminderTrigger.MANUAL) {
    await this.findOneOrFail(id);

    const hasRecipientTable = await this.hasTable('notification_recipients');
    if (!hasRecipientTable) {
      throw new ServiceUnavailableException({
        code: 'NTF_RECIPIENT_TABLE_MISSING',
        message:
          'Bảng notification_recipients chưa tồn tại. Vui lòng cập nhật schema/migration cho module Event Notifications.',
      });
    }

    let recipients: NotificationRecipientEntity[];
    if (dto.recipientIds?.length) {
      recipients = await this.recipientRepo.findByIds(dto.recipientIds);
    } else {
      recipients = await this.recipientRepo.find({ where: { notificationId: id } });
    }

    const logs = recipients.map((r) =>
      this.reminderLogRepo.create({
        id: uuidv4(),
        notificationId: id,
        recipientId: r.id,
        sentAt: new Date(),
        channel: dto.channel as any,
        result: ReminderResult.SUCCESS,
        triggeredBy,
        createdAt: new Date(),
      }),
    );
    await this.reminderLogRepo.save(logs);

    return {
      success: true,
      data: { sentCount: logs.length, sentTo: recipients.map((r) => r.departmentId) },
    };
  }

  private async pushToSystemNotificationInbox(params: {
    event: EventEntity;
    eventNotification: EventNotificationEntity;
    recipients: NotificationRecipientEntity[];
    senderId: string;
  }): Promise<void> {
    const departmentIds = Array.from(
      new Set(
        (params.recipients || [])
          .map((item) => String(item.departmentId || '').trim())
          .filter(Boolean),
      ),
    );

    if (!departmentIds.length) {
      throw new BadRequestException({
        code: 'NTF_004',
        message: 'Không có phòng ban hợp lệ để gửi thông báo.',
      });
    }

    const rawUsers = await this.userRepo
      .createQueryBuilder('u')
      .select('u.id', 'id')
      .where('u.parent IN (:...departmentIds)', { departmentIds })
      .andWhere('u.status = :status', { status: STATUS.ACTIVED })
      .getRawMany<{ id: string }>();

    const recipientIds = Array.from(
      new Set((rawUsers || []).map((user) => String(user.id || '').trim()).filter(Boolean)),
    );

    if (!recipientIds.length) {
      throw new BadRequestException({
        code: 'NTF_005',
        message: 'Không tìm thấy người nhận thuộc các phòng ban đã chọn.',
      });
    }

    const eventName = String(params.event?.name || '').trim();
    const title = String(params.eventNotification?.title || '').trim();
    const content = eventName
      ? `[Sự kiện] ${title} - ${eventName}`
      : `[Sự kiện] ${title}`;

    await this.coreNotificationService.createForRecipients({
      recipientIds,
      senderId: params.senderId || 'system',
      content,
      key: 'VIEW_EVENT_NOTIFICATION',
      recordId: params.event.id,
      link: `/event-management/events/${params.event.id}`,
      isRead: false,
      status: 1,
      time: new Date(),
    });
  }

  private async findOneOrFail(id: string): Promise<EventNotificationEntity> {
    const n = await this.notificationRepo.findOne({ where: { id } });
    if (!n) throw new NotFoundException({ code: 'NTF_001', message: 'Thông báo không tồn tại' });
    return n;
  }

  private async hasTable(tableName: string): Promise<boolean> {
    if (this.tableExistsCache.has(tableName)) {
      return this.tableExistsCache.get(tableName) as boolean;
    }

    try {
      const rows = await this.notificationRepo.query(
        `
          SELECT 1 AS found_table
          FROM sys.tables
          WHERE name = @0
        `,
        [tableName],
      );
      const exists = Array.isArray(rows) && rows.length > 0;
      this.tableExistsCache.set(tableName, exists);
      return exists;
    } catch (error) {
      this.logger.error(`Failed to check table "${tableName}"`, error as any);
      return false;
    }
  }
}
