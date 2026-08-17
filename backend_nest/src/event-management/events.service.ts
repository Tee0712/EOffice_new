import { Injectable, NotFoundException, BadRequestException, UnprocessableEntityException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { randomUUID } from 'crypto';
import { EventEntity, EventStatus } from './entities/event.entity';
import { EventProgramEntity } from './entities/event-program.entity';
import { EventAttachmentEntity } from './entities/event-attachment.entity';
import { EventNotificationEntity, NotificationStatus } from './entities/event-notification.entity';
import { NotificationRecipientEntity } from './entities/notification-recipient.entity';
import { NotificationConfirmationEntity, ConfirmationStatus } from './entities/notification-confirmation.entity';
import { GuestRegistrationEntity, RegistrationStatus } from './entities/guest-registration.entity';
import { EventSatisfactionSurveyEntity } from './entities/event-satisfaction-survey.entity';
import { EventSatisfactionResponseEntity } from './entities/event-satisfaction-response.entity';
import { CreateEventDto } from './dto/events/create-event.dto';
import { EventLifecycleStatus, QueryEventDto } from './dto/events/query-event.dto';
import { UpdateEventStatusDto } from './dto/events/update-event-status.dto';
import { CreateSatisfactionSurveyDto } from './dto/events/create-satisfaction-survey.dto';
import { SubmitSatisfactionResponseDto } from './dto/events/submit-satisfaction-response.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private eventColumnsCache: Set<string> | null = null;
  private tableExistsCache = new Map<string, boolean>();

  constructor(
    @InjectRepository(EventEntity, 'mssqlConnection')
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(EventProgramEntity, 'mssqlConnection')
    private readonly programRepo: Repository<EventProgramEntity>,
    @InjectRepository(EventAttachmentEntity, 'mssqlConnection')
    private readonly attachmentRepo: Repository<EventAttachmentEntity>,
    @InjectRepository(EventNotificationEntity, 'mssqlConnection')
    private readonly notificationRepo: Repository<EventNotificationEntity>,
    @InjectRepository(NotificationRecipientEntity, 'mssqlConnection')
    private readonly recipientRepo: Repository<NotificationRecipientEntity>,
    @InjectRepository(NotificationConfirmationEntity, 'mssqlConnection')
    private readonly confirmationRepo: Repository<NotificationConfirmationEntity>,
    @InjectRepository(GuestRegistrationEntity, 'mssqlConnection')
    private readonly guestRegistrationRepo: Repository<GuestRegistrationEntity>,
    @InjectRepository(EventSatisfactionSurveyEntity, 'mssqlConnection')
    private readonly surveyRepo: Repository<EventSatisfactionSurveyEntity>,
    @InjectRepository(EventSatisfactionResponseEntity, 'mssqlConnection')
    private readonly surveyResponseRepo: Repository<EventSatisfactionResponseEntity>,
  ) {}

  async findAll(query: QueryEventDto) {
    const { page = 0, size = 20 } = query;
    const columns = await this.getEventColumns();
    if (columns.size === 0) {
      this.logger.warn('Table "events" not found or has no readable columns. Returning empty list.');
      return {
        success: true,
        data: [],
        pagination: { page, size, total: 0 },
      };
    }

    const dataQb = this.eventRepo.manager.createQueryBuilder().from('events', 'e');
    const selectColumns: string[] = [];

    const addSelect = (columnName: string, alias: string) => {
      if (columns.has(columnName)) selectColumns.push(`e.${columnName} AS ${alias}`);
    };

    addSelect('id', 'id');
    addSelect('code', 'code');
    addSelect('name', 'name');
    addSelect('start_datetime', 'startDatetime');
    addSelect('end_datetime', 'endDatetime');
    addSelect('location', 'location');
    addSelect('status', 'status');

    const eventTypeColumn = this.getFirstExistingColumn(columns, ['event_type', 'type']);
    const coordinationStatusColumn = this.getFirstExistingColumn(columns, [
      'coordination_status',
      'workflow_status',
      'process_status',
    ]);
    const checklistProgressColumn = this.getFirstExistingColumn(columns, [
      'checklist_progress',
      'checklist_percent',
    ]);
    const checklistDoneColumn = this.getFirstExistingColumn(columns, [
      'checklist_completed',
      'checklist_done',
    ]);
    const checklistTotalColumn = this.getFirstExistingColumn(columns, [
      'checklist_total',
      'checklist_count',
    ]);

    if (eventTypeColumn) addSelect(eventTypeColumn, 'eventType');
    if (coordinationStatusColumn) addSelect(coordinationStatusColumn, 'coordinationStatus');
    if (checklistProgressColumn) addSelect(checklistProgressColumn, 'checklistProgress');
    if (checklistDoneColumn) addSelect(checklistDoneColumn, 'checklistDone');
    if (checklistTotalColumn) addSelect(checklistTotalColumn, 'checklistTotal');

    if (selectColumns.length === 0) {
      this.logger.warn('No expected list columns found in table "events". Returning empty list.');
      return {
        success: true,
        data: [],
        pagination: { page, size, total: 0 },
      };
    }

    dataQb.select(selectColumns);

    if (columns.has('deleted_at')) {
      dataQb.where('e.deleted_at IS NULL');
    }

    this.applyListFilters(dataQb, query, columns);

    const orderColumn = columns.has('created_at')
      ? 'e.created_at'
      : (columns.has('start_datetime') ? 'e.start_datetime' : 'e.id');

    dataQb.orderBy(orderColumn, 'DESC').skip(page * size).take(size);

    const countQb = this.eventRepo.manager.createQueryBuilder().from('events', 'e').select('COUNT(1)', 'total');
    if (columns.has('deleted_at')) {
      countQb.where('e.deleted_at IS NULL');
    }
    this.applyListFilters(countQb, query, columns);

    const [items, totalRaw] = await Promise.all([
      dataQb.getRawMany(),
      countQb.getRawOne<{ total: string | number }>(),
    ]);
    const total = Number(totalRaw?.total ?? 0);

    return {
      success: true,
      data: items.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        startDatetime: item.startDatetime,
        endDatetime: item.endDatetime,
        location: item.location,
        status: item.status,
        eventType: item.eventType || null,
        coordinationStatus: item.coordinationStatus || null,
        checklistProgress: this.resolveChecklistProgress(item),
      })),
      pagination: { page, size, total },
    };
  }

  async create(dto: CreateEventDto, userId: string) {
    await this.ensureEventTableAvailable();

    if (new Date(dto.endDatetime) < new Date(dto.startDatetime)) {
      throw new UnprocessableEntityException({ code: 'EVT_DATE', message: 'endDatetime < startDatetime' });
    }

    const code = await this.generateCode();
    const event = this.eventRepo.create({
      id: randomUUID(),
      code,
      name: dto.name,
      description: dto.description,
      startDatetime: new Date(dto.startDatetime),
      endDatetime: new Date(dto.endDatetime),
      location: dto.location,
      locationDetail: dto.locationDetail,
      maxTotalGuests: dto.maxTotalGuests,
      confirmationDeadline: dto.confirmationDeadline ? new Date(dto.confirmationDeadline) : null,
      guestRegDeadline: dto.guestRegDeadline ? new Date(dto.guestRegDeadline) : null,
      allowGuestReg: dto.allowGuestReg ?? true,
      createdBy: userId,
      status: EventStatus.DRAFT,
    });

    const saved = await this.eventRepo.save(event);

    if (dto.programs?.length) {
      const programs = dto.programs.map((p) =>
        this.programRepo.create({
          eventId: saved.id,
          orderNo: p.orderNo,
          title: p.title,
          description: p.description,
          startTime: new Date(p.startTime),
          endTime: p.endTime ? new Date(p.endTime) : null,
          presenter: p.presenter,
        }),
      );
      await this.programRepo.save(programs);
    }

    return { success: true, data: { id: saved.id, code: saved.code, status: saved.status } };
  }

  async findOne(id: string) {
    await this.ensureEventTableAvailable();

    const event = await this.eventRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['programs', 'attachments'],
    });
    if (!event) throw new NotFoundException({ code: 'EVT_001', message: 'Sự kiện không tồn tại' });
    return { success: true, data: event };
  }

  async update(id: string, dto: Partial<CreateEventDto>) {
    await this.ensureEventTableAvailable();

    const event = await this.findOneOrFail(id);
    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException({ code: 'EVT_002', message: 'Không thể cập nhật sự kiện đã hủy' });
    }
    Object.assign(event, {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.startDatetime && { startDatetime: new Date(dto.startDatetime) }),
      ...(dto.endDatetime && { endDatetime: new Date(dto.endDatetime) }),
      ...(dto.location && { location: dto.location }),
      ...(dto.locationDetail !== undefined && { locationDetail: dto.locationDetail }),
      ...(dto.maxTotalGuests !== undefined && { maxTotalGuests: dto.maxTotalGuests }),
      ...(dto.confirmationDeadline !== undefined && { confirmationDeadline: dto.confirmationDeadline ? new Date(dto.confirmationDeadline) : null }),
      ...(dto.guestRegDeadline !== undefined && { guestRegDeadline: dto.guestRegDeadline ? new Date(dto.guestRegDeadline) : null }),
      ...(dto.allowGuestReg !== undefined && { allowGuestReg: dto.allowGuestReg }),
    });
    const saved = await this.eventRepo.save(event);
    return { success: true, data: saved };
  }

  async updateStatus(id: string, dto: UpdateEventStatusDto) {
    await this.ensureEventTableAvailable();

    const event = await this.findOneOrFail(id);
    if (dto.status === EventStatus.CANCELLED && !dto.reason) {
      throw new BadRequestException({ code: 'EVT_REASON', message: 'Lý do hủy là bắt buộc' });
    }
    event.status = dto.status;
    const saved = await this.eventRepo.save(event);
    return { success: true, data: { id: saved.id, status: saved.status } };
  }

  async saveAttachment(eventId: string, fileName: string, fileUrl: string, fileSize: number, fileType: string, category: string, userId: string) {
    await this.ensureEventTableAvailable();

    await this.findOneOrFail(eventId);
    const attachment = this.attachmentRepo.create({ eventId, fileName, fileUrl, fileSize, fileType, category: category as any, uploadedBy: userId });
    const saved = await this.attachmentRepo.save(attachment);
    return { success: true, data: saved };
  }

  async deleteAttachment(eventId: string, attachmentId: string) {
    await this.ensureEventTableAvailable();

    const attachment = await this.attachmentRepo.findOne({ where: { id: attachmentId, eventId } });
    if (!attachment) throw new NotFoundException('Attachment không tồn tại');
    await this.attachmentRepo.remove(attachment);
    return { success: true, data: null };
  }

  async getSuggestedDepartments(eventId: string, keyword?: string) {
    await this.ensureEventTableAvailable();

    await this.findOneOrFail(eventId);
    // Trả về rỗng - logic gợi ý phụ thuộc departments table riêng
    return { success: true, data: [] };
  }

  async getDashboard(eventId: string) {
    await this.ensureEventTableAvailable();

    const event = await this.findOneOrFail(eventId);
    const now = new Date();
    const daysRemaining = event.confirmationDeadline
      ? Math.ceil((event.confirmationDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    return {
      success: true,
      data: {
        event: {
          id: event.id,
          code: event.code,
          name: event.name,
          startDatetime: event.startDatetime,
          location: event.location,
          status: event.status,
          confirmationDeadline: event.confirmationDeadline,
          daysRemaining,
        },
        stats: { totalDepartments: 0, confirmedCount: 0, pendingCount: 0, declinedCount: 0, totalRegisteredGuests: 0, totalGuestQuota: event.maxTotalGuests ?? 0 },
        departments: [],
      },
    };
  }

  async getSummary(query: QueryEventDto) {
    const columns = await this.getEventColumns();
    if (columns.size === 0) {
      return {
        success: true,
        data: {
          total: 0,
          upcoming30Days: 0,
          ongoing: 0,
          checklistPending: 0,
        },
      };
    }

    const now = new Date();
    const days30Later = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const buildBaseQb = () => {
      const qb = this.eventRepo.manager.createQueryBuilder().from('events', 'e').select('COUNT(1)', 'total');
      if (columns.has('deleted_at')) {
        qb.where('e.deleted_at IS NULL');
      }
      this.applyListFilters(qb, query, columns, { includeLifecycle: false });
      return qb;
    };

    const totalQb = buildBaseQb();
    const upcomingQb = buildBaseQb();
    const ongoingQb = buildBaseQb();
    const checklistPendingQb = buildBaseQb();

    if (columns.has('start_datetime')) {
      upcomingQb.andWhere('e.start_datetime >= :now AND e.start_datetime <= :days30Later', {
        now,
        days30Later,
      });
    } else if (columns.has('status')) {
      upcomingQb.andWhere('e.status = :upcomingStatus', { upcomingStatus: EventStatus.PUBLISHED });
    }

    if (columns.has('start_datetime') && columns.has('end_datetime')) {
      ongoingQb.andWhere('e.start_datetime <= :now AND e.end_datetime >= :now', { now });
    } else if (columns.has('status')) {
      ongoingQb.andWhere('e.status = :ongoingStatus', { ongoingStatus: EventStatus.ONGOING });
    }

    const checklistProgressColumn = this.getFirstExistingColumn(columns, [
      'checklist_progress',
      'checklist_percent',
    ]);
    if (checklistProgressColumn) {
      checklistPendingQb.andWhere(`ISNULL(e.${checklistProgressColumn}, 0) < 100`);
    } else {
      checklistPendingQb.andWhere('1 = 0');
    }

    const [totalRaw, upcomingRaw, ongoingRaw, checklistPendingRaw] = await Promise.all([
      totalQb.getRawOne<{ total: string | number }>(),
      upcomingQb.getRawOne<{ total: string | number }>(),
      ongoingQb.getRawOne<{ total: string | number }>(),
      checklistPendingQb.getRawOne<{ total: string | number }>(),
    ]);

    return {
      success: true,
      data: {
        total: Number(totalRaw?.total ?? 0),
        upcoming30Days: Number(upcomingRaw?.total ?? 0),
        ongoing: Number(ongoingRaw?.total ?? 0),
        checklistPending: Number(checklistPendingRaw?.total ?? 0),
      },
    };
  }

  async getInteractionStats(eventId: string) {
    await this.ensureEventTableAvailable();
    await this.findOneOrFail(eventId);

    const hasNotificationTable = await this.hasTable('event_notifications');
    const hasRecipientTable = await this.hasTable('notification_recipients');
    const hasConfirmationTable = await this.hasTable('notification_confirmations');
    const hasGuestRegistrationTable = await this.hasTable('guest_registrations');

    const [notifications, recipients, confirmations, registrations, surveyStats] = await Promise.all([
      hasNotificationTable
        ? this.notificationRepo.find({ where: { eventId }, order: { createdAt: 'DESC' } })
        : Promise.resolve([]),
      hasNotificationTable && hasRecipientTable
        ? this.recipientRepo
            .createQueryBuilder('recipient')
            .innerJoin('event_notifications', 'notification', 'notification.id = recipient.notification_id')
            .where('notification.event_id = :eventId', { eventId })
            .getMany()
        : Promise.resolve([]),
      hasNotificationTable && hasRecipientTable && hasConfirmationTable
        ? this.confirmationRepo
            .createQueryBuilder('confirmation')
            .innerJoin('notification_recipients', 'recipient', 'recipient.id = confirmation.recipient_id')
            .innerJoin('event_notifications', 'notification', 'notification.id = recipient.notification_id')
            .where('notification.event_id = :eventId', { eventId })
            .getMany()
        : Promise.resolve([]),
      hasGuestRegistrationTable
        ? this.guestRegistrationRepo.count({
            where: { eventId, status: RegistrationStatus.ACTIVE },
          })
        : Promise.resolve(0),
      this.getSurveyStats(eventId),
    ]);

    const sentNotifications = notifications.filter((n) => n.status === NotificationStatus.SENT).length;
    const recalledNotifications = notifications.filter((n) => n.status === NotificationStatus.RECALLED).length;

    const confirmed = confirmations.filter((c) => c.status === ConfirmationStatus.CONFIRMED).length;
    const declined = confirmations.filter((c) => c.status === ConfirmationStatus.DECLINED).length;
    const pending = Math.max(recipients.length - confirmed - declined, 0);
    const confirmationRate = recipients.length
      ? Math.round((confirmed / recipients.length) * 100)
      : 0;

    const engagementScore = Math.round(
      confirmationRate * 0.45 + surveyStats.averageRating * 20 * 0.35 + Math.min(registrations, 100) * 0.2,
    );

    return {
      success: true,
      data: {
        notifications: {
          total: notifications.length,
          sent: sentNotifications,
          recalled: recalledNotifications,
          latestSentAt: notifications.find((n) => n.sentAt)?.sentAt || null,
        },
        confirmations: {
          totalRecipients: recipients.length,
          confirmed,
          declined,
          pending,
          confirmationRate,
        },
        guests: {
          registered: registrations,
        },
        survey: surveyStats,
        engagementScore: Math.max(0, Math.min(100, engagementScore)),
      },
    };
  }

  async upsertSatisfactionSurvey(eventId: string, dto: CreateSatisfactionSurveyDto, userId: string) {
    await this.ensureEventTableAvailable();
    await this.ensureSurveyTablesAvailable();
    await this.findOneOrFail(eventId);

    const options = (dto.options || []).map((item) => String(item).trim()).filter(Boolean).slice(0, 10);

    let survey = await this.surveyRepo.findOne({ where: { eventId } });
    if (!survey) {
      survey = this.surveyRepo.create({
        eventId,
        title: dto.title.trim(),
        question: dto.question.trim(),
        optionsJson: options.length ? JSON.stringify(options) : null,
        isActive: dto.isActive ?? true,
        allowComment: dto.allowComment ?? true,
        isAnonymous: dto.isAnonymous ?? false,
        createdBy: userId,
      });
    } else {
      survey.title = dto.title.trim();
      survey.question = dto.question.trim();
      survey.optionsJson = options.length ? JSON.stringify(options) : null;
      survey.isActive = dto.isActive ?? survey.isActive;
      survey.allowComment = dto.allowComment ?? survey.allowComment;
      survey.isAnonymous = dto.isAnonymous ?? survey.isAnonymous;
    }

    const saved = await this.surveyRepo.save(survey);
    return {
      success: true,
      data: {
        id: saved.id,
        eventId: saved.eventId,
        title: saved.title,
        question: saved.question,
        options,
        isActive: saved.isActive,
        allowComment: saved.allowComment,
        isAnonymous: saved.isAnonymous,
      },
    };
  }

  async getSatisfactionSurvey(eventId: string, userId: string | null) {
    await this.ensureEventTableAvailable();
    await this.findOneOrFail(eventId);

    const tablesReady = await this.hasTable('event_satisfaction_surveys')
      && await this.hasTable('event_satisfaction_responses');
    if (!tablesReady) {
      return {
        success: true,
        data: {
          survey: null,
          currentUserResponse: null,
          stats: {
            hasSurvey: false,
            totalResponses: 0,
            averageRating: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          },
        },
      };
    }

    const survey = await this.surveyRepo.findOne({ where: { eventId } });
    if (!survey) {
      return {
        success: true,
        data: {
          survey: null,
          currentUserResponse: null,
          stats: {
            hasSurvey: false,
            totalResponses: 0,
            averageRating: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          },
        },
      };
    }

    const stats = await this.getSurveyStats(eventId);
    const currentUserResponse = userId
      ? await this.surveyResponseRepo.findOne({
          where: { surveyId: survey.id, respondentUserId: userId },
          order: { createdAt: 'DESC' },
        })
      : null;

    return {
      success: true,
      data: {
        survey: {
          id: survey.id,
          eventId: survey.eventId,
          title: survey.title,
          question: survey.question,
          options: this.parseSurveyOptions(survey.optionsJson),
          isActive: survey.isActive,
          allowComment: survey.allowComment,
          isAnonymous: survey.isAnonymous,
          createdAt: survey.createdAt,
          updatedAt: survey.updatedAt,
        },
        currentUserResponse: currentUserResponse
          ? {
              id: currentUserResponse.id,
              ratingValue: currentUserResponse.ratingValue,
              selectedOption: currentUserResponse.selectedOption,
              comment: currentUserResponse.comment,
              createdAt: currentUserResponse.createdAt,
            }
          : null,
        stats,
      },
    };
  }

  async submitSatisfactionResponse(
    eventId: string,
    dto: SubmitSatisfactionResponseDto,
    userId: string | null,
    userName: string | null,
    departmentId: string | null,
  ) {
    await this.ensureEventTableAvailable();
    await this.ensureSurveyTablesAvailable();
    await this.findOneOrFail(eventId);

    const survey = await this.surveyRepo.findOne({ where: { eventId, isActive: true } });
    if (!survey) {
      throw new NotFoundException({
        code: 'EVT_SURVEY_NOT_FOUND',
        message: 'Khảo sát hài lòng chưa được thiết lập cho sự kiện này.',
      });
    }

    const selectedOption = dto.selectedOption ? String(dto.selectedOption).trim() : null;
    const allowedOptions = this.parseSurveyOptions(survey.optionsJson);
    if (selectedOption && allowedOptions.length > 0 && !allowedOptions.includes(selectedOption)) {
      throw new BadRequestException({
        code: 'EVT_SURVEY_OPTION_INVALID',
        message: 'Lựa chọn đánh giá không hợp lệ.',
      });
    }

    const where = survey.isAnonymous || !userId
      ? null
      : { surveyId: survey.id, respondentUserId: userId };

    let response = where
      ? await this.surveyResponseRepo.findOne({ where })
      : null;

    if (!response) {
      response = this.surveyResponseRepo.create({
        surveyId: survey.id,
        eventId,
        respondentUserId: survey.isAnonymous ? null : userId,
        respondentName: survey.isAnonymous ? null : userName,
        departmentId: survey.isAnonymous ? null : departmentId,
        ratingValue: dto.ratingValue,
        selectedOption: selectedOption || null,
        comment: survey.allowComment ? (dto.comment?.trim() || null) : null,
      });
    } else {
      response.ratingValue = dto.ratingValue;
      response.selectedOption = selectedOption || null;
      response.comment = survey.allowComment ? (dto.comment?.trim() || null) : null;
    }

    const saved = await this.surveyResponseRepo.save(response);
    const stats = await this.getSurveyStats(eventId);

    return {
      success: true,
      data: {
        id: saved.id,
        ratingValue: saved.ratingValue,
        selectedOption: saved.selectedOption,
        comment: saved.comment,
        createdAt: saved.createdAt,
        stats,
      },
    };
  }

  private async generateCode(): Promise<string> {
    await this.ensureEventTableAvailable();

    const year = new Date().getFullYear();
    const count = await this.eventRepo.count();
    return `SK-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  private async findOneOrFail(id: string): Promise<EventEntity> {
    await this.ensureEventTableAvailable();

    const event = await this.eventRepo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!event) throw new NotFoundException({ code: 'EVT_001', message: 'Sự kiện không tồn tại' });
    return event;
  }

  private toListItem(e: EventEntity) {
    return {
      id: e.id,
      code: e.code,
      name: e.name,
      startDatetime: e.startDatetime,
      endDatetime: e.endDatetime,
      location: e.location,
      status: e.status,
    };
  }

  private getFirstExistingColumn(columns: Set<string>, candidates: string[]): string | null {
    for (const candidate of candidates) {
      if (columns.has(candidate)) return candidate;
    }
    return null;
  }

  private resolveChecklistProgress(raw: Record<string, any>): number | null {
    const progress = this.toNumberOrNull(raw.checklistProgress);
    if (progress !== null) return progress;

    const done = this.toNumberOrNull(raw.checklistDone);
    const total = this.toNumberOrNull(raw.checklistTotal);
    if (done !== null && total && total > 0) {
      return Math.round((done / total) * 100);
    }

    return null;
  }

  private toNumberOrNull(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private applyListFilters(
    qb: any,
    query: QueryEventDto,
    columns: Set<string>,
    options?: { includeLifecycle?: boolean },
  ) {
    const { status, fromDate, toDate, keyword, lifecycle, year, type } = query;

    if (status && columns.has('status')) {
      qb.andWhere('e.status = :status', { status });
    }

    if (fromDate && columns.has('start_datetime')) {
      qb.andWhere('e.start_datetime >= :fromDate', { fromDate: new Date(fromDate) });
    }

    if (toDate && columns.has('start_datetime')) {
      qb.andWhere('e.start_datetime <= :toDate', { toDate: new Date(toDate) });
    }

    if (typeof year === 'number' && Number.isFinite(year) && columns.has('start_datetime')) {
      const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      const yearEnd = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
      qb.andWhere('e.start_datetime >= :yearStart AND e.start_datetime < :yearEnd', {
        yearStart,
        yearEnd,
      });
    }

    const eventTypeColumn = this.getFirstExistingColumn(columns, ['event_type', 'type']);
    if (type && eventTypeColumn) {
      qb.andWhere(`e.${eventTypeColumn} = :eventType`, { eventType: type });
    }

    if (keyword) {
      if (columns.has('name') && columns.has('code')) {
        qb.andWhere('(e.name LIKE :kw OR e.code LIKE :kw)', { kw: `%${keyword}%` });
      } else if (columns.has('name')) {
        qb.andWhere('e.name LIKE :kw', { kw: `%${keyword}%` });
      } else if (columns.has('code')) {
        qb.andWhere('e.code LIKE :kw', { kw: `%${keyword}%` });
      }
    }

    const shouldApplyLifecycle = options?.includeLifecycle !== false;
    if (!shouldApplyLifecycle || !lifecycle) return;

    const now = new Date();
    if (columns.has('start_datetime') && columns.has('end_datetime')) {
      if (lifecycle === EventLifecycleStatus.UPCOMING) {
        qb.andWhere('e.start_datetime > :now', { now });
      } else if (lifecycle === EventLifecycleStatus.ONGOING) {
        qb.andWhere('e.start_datetime <= :now AND e.end_datetime >= :now', { now });
      } else if (lifecycle === EventLifecycleStatus.COMPLETED) {
        qb.andWhere('e.end_datetime < :now', { now });
      }
      return;
    }

    if (!columns.has('status')) return;

    if (lifecycle === EventLifecycleStatus.UPCOMING) {
      qb.andWhere('e.status IN (:...upcomingStatus)', {
        upcomingStatus: [EventStatus.PUBLISHED, EventStatus.DRAFT],
      });
    } else if (lifecycle === EventLifecycleStatus.ONGOING) {
      qb.andWhere('e.status = :ongoingStatus', { ongoingStatus: EventStatus.ONGOING });
    } else if (lifecycle === EventLifecycleStatus.COMPLETED) {
      qb.andWhere('e.status = :completedStatus', { completedStatus: EventStatus.COMPLETED });
    }
  }

  private async getEventColumns(): Promise<Set<string>> {
    if (this.eventColumnsCache) return this.eventColumnsCache;
    try {
      const rows = await this.eventRepo.query(`
        SELECT c.name AS column_name
        FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        WHERE t.name = 'events'
      `);

      const columns = new Set<string>((rows || []).map((r: any) => String(r.column_name)));
      this.eventColumnsCache = columns;
      return columns;
    } catch (error) {
      this.logger.error('Failed to inspect table "events" schema', error as any);
      return new Set<string>();
    }
  }

  private parseSurveyOptions(optionsJson: string | null): string[] {
    if (!optionsJson) return [];
    try {
      const parsed = JSON.parse(optionsJson);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      return [];
    }
  }

  private async getSurveyStats(eventId: string) {
    const hasSurveyTable = await this.hasTable('event_satisfaction_surveys');
    const hasResponseTable = await this.hasTable('event_satisfaction_responses');
    if (!hasSurveyTable || !hasResponseTable) {
      return {
        hasSurvey: false,
        totalResponses: 0,
        averageRating: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const survey = await this.surveyRepo.findOne({ where: { eventId } });
    if (!survey) {
      return {
        hasSurvey: false,
        totalResponses: 0,
        averageRating: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const responses = await this.surveyResponseRepo.find({
      where: { eventId, surveyId: survey.id },
    });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    responses.forEach((item) => {
      const rating = Number(item.ratingValue);
      if (rating >= 1 && rating <= 5) {
        distribution[rating as 1 | 2 | 3 | 4 | 5] += 1;
      }
    });

    const totalResponses = responses.length;
    const averageRating = totalResponses
      ? Number(
          (responses.reduce((sum, current) => sum + Number(current.ratingValue || 0), 0) / totalResponses).toFixed(2),
        )
      : 0;

    return {
      hasSurvey: true,
      totalResponses,
      averageRating,
      distribution,
    };
  }

  private async hasTable(tableName: string): Promise<boolean> {
    if (this.tableExistsCache.get(tableName) === true) {
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
      if (exists) {
        this.tableExistsCache.set(tableName, true);
      }
      return exists;
    } catch (error) {
      this.logger.error(`Failed to check table "${tableName}"`, error as any);
      return false;
    }
  }

  private async ensureSurveyTablesAvailable(): Promise<void> {
    const [surveyTable, responseTable] = await Promise.all([
      this.hasTable('event_satisfaction_surveys'),
      this.hasTable('event_satisfaction_responses'),
    ]);
    if (surveyTable && responseTable) return;

    throw new ServiceUnavailableException({
      code: 'EVT_SURVEY_TABLE_MISSING',
      message:
        'Bảng khảo sát hài lòng sự kiện chưa tồn tại. Vui lòng cập nhật schema/migration cho event_satisfaction_surveys và event_satisfaction_responses.',
    });
  }

  private async ensureEventTableAvailable(): Promise<void> {
    const columns = await this.getEventColumns();
    if (columns.size > 0) return;

    throw new ServiceUnavailableException({
      code: 'EVT_TABLE_MISSING',
      message:
        'Bảng dữ liệu sự kiện (events) chưa tồn tại trong CSDL hiện tại. Vui lòng kiểm tra migration/schema.',
    });
  }
}
