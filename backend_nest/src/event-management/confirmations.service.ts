import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationRecipientEntity } from './entities/notification-recipient.entity';
import { NotificationConfirmationEntity, ConfirmationStatus } from './entities/notification-confirmation.entity';
import { ReminderLogEntity } from './entities/reminder-log.entity';
import { ConfirmRecipientDto } from './dto/confirmations/confirm-recipient.dto';
import { EventNotificationEntity } from './entities/event-notification.entity';

@Injectable()
export class ConfirmationsService {
  constructor(
    @InjectRepository(NotificationRecipientEntity, 'mssqlConnection')
    private readonly recipientRepo: Repository<NotificationRecipientEntity>,
    @InjectRepository(NotificationConfirmationEntity, 'mssqlConnection')
    private readonly confirmationRepo: Repository<NotificationConfirmationEntity>,
    @InjectRepository(ReminderLogEntity, 'mssqlConnection')
    private readonly reminderLogRepo: Repository<ReminderLogEntity>,
    @InjectRepository(EventNotificationEntity, 'mssqlConnection')
    private readonly notificationRepo: Repository<EventNotificationEntity>,
  ) {}

  async confirm(recipientId: string, dto: ConfirmRecipientDto, userId: string) {
    const recipient = await this.getRecipient(recipientId);
    const notification = await this.notificationRepo.findOne({ where: { id: recipient.notificationId }, relations: ['event'] });

    if (notification?.event?.confirmationDeadline && new Date() > notification.event.confirmationDeadline) {
      throw new ForbiddenException({ code: 'CFM_001', message: 'Đã quá hạn xác nhận' });
    }

    if (dto.status === ConfirmationStatus.DECLINED && !dto.declineReason) {
      throw new BadRequestException({ code: 'CFM_002', message: 'Lý do từ chối là bắt buộc' });
    }

    let confirmation = await this.confirmationRepo.findOne({ where: { recipientId } });
    if (!confirmation) {
      confirmation = this.confirmationRepo.create({ recipientId });
    }

    confirmation.status = dto.status;
    confirmation.confirmedBy = userId;
    confirmation.confirmedAt = new Date();
    confirmation.attendeeCount = dto.attendeeCount ?? null;
    confirmation.declineReason = dto.declineReason ?? null;
    confirmation.note = dto.note ?? null;

    const saved = await this.confirmationRepo.save(confirmation);
    return {
      success: true,
      data: { id: saved.id, status: saved.status, confirmedAt: saved.confirmedAt, confirmedBy: saved.confirmedBy },
    };
  }

  async getConfirmation(recipientId: string) {
    await this.getRecipient(recipientId);
    const confirmation = await this.confirmationRepo.findOne({ where: { recipientId } });
    return {
      success: true,
      data: confirmation ?? { status: ConfirmationStatus.PENDING, confirmedBy: null, confirmedAt: null, attendeeCount: null, declineReason: null, note: null },
    };
  }

  async getReminders(recipientId: string) {
    await this.getRecipient(recipientId);
    const logs = await this.reminderLogRepo.find({ where: { recipientId }, order: { sentAt: 'DESC' } });
    return { success: true, data: logs };
  }

  private async getRecipient(recipientId: string): Promise<NotificationRecipientEntity> {
    const recipient = await this.recipientRepo.findOne({ where: { id: recipientId } });
    if (!recipient) throw new NotFoundException('Recipient không tồn tại');
    return recipient;
  }
}
