import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  ForbiddenException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EventGuestEntity } from './entities/event-guest.entity';
import { GuestRegistrationEntity, RegistrationStatus } from './entities/guest-registration.entity';
import { NotificationRecipientEntity } from './entities/notification-recipient.entity';
import { EventEntity } from './entities/event.entity';
import { CreateGuestDto } from './dto/guests/create-guest.dto';
import { QueryGuestDto } from './dto/guests/query-guest.dto';

@Injectable()
export class GuestsService {
  private readonly logger = new Logger(GuestsService.name);
  private readonly tableExistsCache = new Map<string, boolean>();

  constructor(
    @InjectRepository(EventGuestEntity, 'mssqlConnection')
    private readonly guestRepo: Repository<EventGuestEntity>,
    @InjectRepository(GuestRegistrationEntity, 'mssqlConnection')
    private readonly registrationRepo: Repository<GuestRegistrationEntity>,
    @InjectRepository(NotificationRecipientEntity, 'mssqlConnection')
    private readonly recipientRepo: Repository<NotificationRecipientEntity>,
    @InjectRepository(EventEntity, 'mssqlConnection')
    private readonly eventRepo: Repository<EventEntity>,
  ) {}

  async checkDuplicate(eventId: string, phone?: string, email?: string) {
    await this.ensureGuestTablesAvailable();
    if (!phone && !email) return { success: true, data: { isDuplicate: false, existingGuest: null } };

    const qb = this.guestRepo.createQueryBuilder('g')
      .innerJoin('guest_registrations', 'r', 'r.guest_id = g.id AND r.event_id = :eventId AND r.status = :status', { eventId, status: RegistrationStatus.ACTIVE });

    if (phone && email) {
      qb.where('(g.phone = :phone OR g.email = :email)', { phone, email });
    } else if (phone) {
      qb.where('g.phone = :phone', { phone });
    } else {
      qb.where('g.email = :email', { email });
    }

    const existing = await qb.getOne();
    if (!existing) return { success: true, data: { isDuplicate: false, existingGuest: null } };

    return { success: true, data: { isDuplicate: true, existingGuest: existing } };
  }

  async registerGuest(eventId: string, departmentId: string, dto: CreateGuestDto, registeredBy: string) {
    await this.ensureGuestTablesAvailable();
    const event = await this.eventRepo.findOne({ where: { id: eventId, deletedAt: IsNull() } });
    if (!event) throw new NotFoundException({ code: 'EVT_001', message: 'Sự kiện không tồn tại' });

    if (event.guestRegDeadline && new Date() > event.guestRegDeadline) {
      throw new ForbiddenException({ code: 'GST_003', message: 'Đã quá hạn đăng ký khách mời' });
    }

    const recipient = await this.recipientRepo
      .createQueryBuilder('r')
      .innerJoin('event_notifications', 'n', 'n.id = r.notification_id AND n.event_id = :eventId', { eventId })
      .where('r.department_id = :departmentId', { departmentId })
      .getOne();

    if (recipient) {
      const usedCount = await this.registrationRepo.count({
        where: { eventId, departmentId, status: RegistrationStatus.ACTIVE },
      });
      const recipientQuota = Number(recipient.maxGuests ?? 0);
      const eventQuota = Number(event.maxTotalGuests ?? 0);
      const effectiveQuota = recipientQuota > 0 ? recipientQuota : eventQuota;
      if (effectiveQuota > 0 && usedCount >= effectiveQuota) {
        throw new UnprocessableEntityException({ code: 'GST_002', message: 'Đã vượt quota khách mời của phòng ban' });
      }
    }

    // Find or create guest master
    let guest: EventGuestEntity;
    const existingCheck = await this.checkDuplicate(eventId, dto.phone, dto.email);

    if (existingCheck.data.isDuplicate && !dto.forceAdd) {
      throw new ConflictException({ code: 'GST_001', message: 'Khách mời đã tồn tại trong sự kiện' });
    }

    // Check same-department duplicate
    if (dto.phone || dto.email) {
      const sameDeptDuplicate = await this.guestRepo.createQueryBuilder('g')
        .innerJoin('guest_registrations', 'r', 'r.guest_id = g.id AND r.event_id = :eventId AND r.department_id = :departmentId AND r.status = :status', {
          eventId, departmentId, status: RegistrationStatus.ACTIVE,
        })
        .where(dto.phone && dto.email ? '(g.phone = :phone OR g.email = :email)' : dto.phone ? 'g.phone = :phone' : 'g.email = :email', {
          phone: dto.phone, email: dto.email,
        })
        .getOne();
      if (sameDeptDuplicate) {
        throw new ConflictException({ code: 'GST_001', message: 'Khách mời đã tồn tại trong danh sách phòng ban' });
      }
    }

    // Find existing guest by phone/email or create new
    const existingGuest = await this.findExistingGuest(dto.phone, dto.email);
    if (existingGuest) {
      guest = existingGuest;
    } else {
      guest = await this.guestRepo.save(this.guestRepo.create({
        fullName: dto.fullName,
        organization: dto.organization,
        title: dto.title,
        phone: dto.phone,
        email: dto.email,
        guestType: dto.guestType,
      }));
    }

    const registration = await this.registrationRepo.save(
      this.registrationRepo.create({
        eventId,
        guestId: guest.id,
        departmentId,
        recipientId: recipient?.id ?? null,
        registeredBy,
        guestType: dto.guestType,
        note: dto.note,
        status: RegistrationStatus.ACTIVE,
      }),
    );

    const usedCount = await this.registrationRepo.count({ where: { eventId, departmentId, status: RegistrationStatus.ACTIVE } });
    return {
      success: true,
      data: {
        registrationId: registration.id,
        guestId: guest.id,
        fullName: guest.fullName,
        guestType: dto.guestType,
        departmentId,
        quotaUsed: usedCount,
        quotaTotal: (() => {
          const recipientQuota = Number(recipient?.maxGuests ?? 0);
          const eventQuota = Number(event.maxTotalGuests ?? 0);
          return recipientQuota > 0 ? recipientQuota : eventQuota;
        })(),
      },
    };
  }

  async findByDepartment(eventId: string, departmentId: string, query: QueryGuestDto) {
    await this.ensureGuestTablesAvailable();
    const { page = 0, size = 20, guestType, keyword } = query;

    const qb = this.registrationRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.guest', 'g')
      .where('r.event_id = :eventId AND r.department_id = :departmentId AND r.status = :status', {
        eventId, departmentId, status: RegistrationStatus.ACTIVE,
      });

    if (guestType) qb.andWhere('r.guest_type = :guestType', { guestType });
    if (keyword) qb.andWhere('(g.full_name LIKE :kw OR g.organization LIKE :kw)', { kw: `%${keyword}%` });

    qb.orderBy('r.createdAt', 'DESC').skip(page * size).take(size);
    const [items, total] = await qb.getManyAndCount();

    const recipient = await this.recipientRepo
      .createQueryBuilder('r2')
      .innerJoin('event_notifications', 'n', 'n.id = r2.notification_id AND n.event_id = :eventId', { eventId })
      .where('r2.department_id = :departmentId', { departmentId })
      .getOne();

    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    const used = await this.registrationRepo.count({ where: { eventId, departmentId, status: RegistrationStatus.ACTIVE } });
    const recipientQuota = Number(recipient?.maxGuests ?? 0);
    const eventQuota = Number(event?.maxTotalGuests ?? 0);
    const quotaTotal = recipientQuota > 0 ? recipientQuota : eventQuota;

    return {
      success: true,
      data: items.map((r) => ({ registrationId: r.id, guestId: r.guestId, ...r.guest, guestType: r.guestType, status: r.status })),
      pagination: { page, size, total },
      quotaSummary: { used, total: quotaTotal, remaining: quotaTotal - used },
    };
  }

  async findAllByEvent(eventId: string, query: QueryGuestDto) {
    await this.ensureGuestTablesAvailable();
    const { page = 0, size = 20, guestType, keyword, departmentId } = query;

    const qb = this.registrationRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.guest', 'g')
      .where('r.event_id = :eventId AND r.status = :status', { eventId, status: RegistrationStatus.ACTIVE });

    if (departmentId) qb.andWhere('r.department_id = :departmentId', { departmentId });
    if (guestType) qb.andWhere('r.guest_type = :guestType', { guestType });
    if (keyword) qb.andWhere('(g.full_name LIKE :kw OR g.organization LIKE :kw OR g.phone LIKE :kw)', { kw: `%${keyword}%` });

    qb.orderBy('r.createdAt', 'DESC').skip(page * size).take(size);
    const [items, total] = await qb.getManyAndCount();

    return {
      success: true,
      data: items.map((r) => ({ registrationId: r.id, ...r.guest, guestType: r.guestType, departmentId: r.departmentId })),
      pagination: { page, size, total },
    };
  }

  async cancelRegistration(eventId: string, registrationId: string) {
    await this.ensureGuestTablesAvailable();
    const reg = await this.registrationRepo.findOne({ where: { id: registrationId, eventId } });
    if (!reg) throw new NotFoundException('Đăng ký không tồn tại');
    reg.status = RegistrationStatus.CANCELLED;
    await this.registrationRepo.save(reg);
    return { success: true, data: null, message: 'Đã hủy đăng ký khách mời thành công' };
  }

  private async findExistingGuest(phone?: string, email?: string): Promise<EventGuestEntity | null> {
    if (!phone && !email) return null;
    const qb = this.guestRepo.createQueryBuilder('g');
    if (phone && email) qb.where('g.phone = :phone OR g.email = :email', { phone, email });
    else if (phone) qb.where('g.phone = :phone', { phone });
    else qb.where('g.email = :email', { email });
    return qb.getOne();
  }

  private async hasTable(tableName: string): Promise<boolean> {
    if (this.tableExistsCache.has(tableName)) {
      return this.tableExistsCache.get(tableName) as boolean;
    }
    try {
      const rows = await this.eventRepo.query(
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

  private async ensureGuestTablesAvailable(): Promise<void> {
    const [guestTable, registrationTable] = await Promise.all([
      this.hasTable('event_guests'),
      this.hasTable('guest_registrations'),
    ]);

    if (guestTable && registrationTable) return;

    throw new ServiceUnavailableException({
      code: 'EVT_GUEST_TABLE_MISSING',
      message:
        'Bảng khách mời sự kiện chưa tồn tại (event_guests/guest_registrations). Vui lòng cập nhật schema/migration.',
    });
  }
}
