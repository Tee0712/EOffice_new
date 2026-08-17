import { Injectable, NotFoundException, BadRequestException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull, In } from 'typeorm';
import { AnnouncementEntity, AnnouncementStatus, AnnouncementPriority } from './entities/announcement.entity';
import { AnnouncementTargetEntity, TargetType } from './entities/announcement-target.entity';
import { AnnouncementAttachmentEntity } from './entities/announcement-attachment.entity';
import { AnnouncementReadStatusEntity } from './entities/announcement-read-status.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { QueryAnnouncementDto, QueryInboxDto } from './dto/query-announcement.dto';
import { IncomingService } from '../documents/incomming-document/incoming.service';
import { OutgoingDocumentsService } from '../outgoing-documents/outgoing-documents.service';

@Injectable()
export class AnnouncementsService implements OnModuleInit {
  async onModuleInit() {
    await this.ensureAnnouncementTables();
    setTimeout(() => {
      void this.backfillMissingReadStatusesForSentAnnouncements();
    }, 0);
  }

  constructor(
    @InjectRepository(AnnouncementEntity, 'mssqlConnection')
    private announcementRepo: Repository<AnnouncementEntity>,
    @InjectRepository(AnnouncementTargetEntity, 'mssqlConnection')
    private targetRepo: Repository<AnnouncementTargetEntity>,
    @InjectRepository(AnnouncementAttachmentEntity, 'mssqlConnection')
    private attachmentRepo: Repository<AnnouncementAttachmentEntity>,
    @InjectRepository(AnnouncementReadStatusEntity, 'mssqlConnection')
    private readStatusRepo: Repository<AnnouncementReadStatusEntity>,
    @InjectRepository(UserEntity, 'mssqlConnection')
    private userRepo: Repository<UserEntity>,
    private incomingService: IncomingService,
    private outgoingService: OutgoingDocumentsService,
  ) {}

  private async ensureAnnouncementTables() {
    await this.announcementRepo.query(`
IF OBJECT_ID('dbo.ann_notifications', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.ann_notifications (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    title NVARCHAR(255) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    priority NVARCHAR(20) NOT NULL DEFAULT 'normal',
    send_at DATETIME NULL,
    sent_at DATETIME NULL,
    created_by NVARCHAR(100) NOT NULL,
    pin_top BIT NOT NULL DEFAULT 0,
    category NVARCHAR(100) NULL,
    require_confirmation BIT NOT NULL DEFAULT 0,
    allow_comment BIT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE()
  );
END;

IF OBJECT_ID('DF_ann_notifications_require_confirmation', 'D') IS NULL
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c
      ON c.object_id = dc.parent_object_id
     AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.ann_notifications')
      AND c.name = 'require_confirmation'
  )
  BEGIN
    ALTER TABLE dbo.ann_notifications
    ADD CONSTRAINT DF_ann_notifications_require_confirmation DEFAULT 0 FOR require_confirmation;
  END
END;
`);
  }

  // ========================= FIX CHÍNH Ở ĐÂY =========================
  async create(userId: string, dto: CreateAnnouncementDto) {
    const isScheduled = !!dto.scheduledAt;
    const targets = Array.isArray(dto.targets)
      ? dto.targets.map((t) =>
          this.targetRepo.create({
            targetType: t.targetType as TargetType,
            targetId: t.targetId ? String(t.targetId) : null,
          }),
        )
      : [];
    const attachments = Array.isArray(dto.attachments)
      ? dto.attachments.map((a) =>
          this.attachmentRepo.create({
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            type: a.type || null,
          }),
        )
      : [];

    const announcement = this.announcementRepo.create({
      title: dto.title,
      content: dto.content,
      senderId: userId,
      status: isScheduled ? AnnouncementStatus.SCHEDULED : AnnouncementStatus.SENT,
      priority: dto.priority ?? AnnouncementPriority.NORMAL,
      scheduledAt: dto.scheduledAt ?? null,
      sentAt: isScheduled ? null : new Date(),

      // 🔥 FIX LỖI NULL
      isPinned: dto.isPinned ?? false,
      category: dto.category ?? null,
      requireConfirmation:
        dto.requireConfirmation ?? dto.requireConfirm ?? false,
      allowComment: dto.allowComment ?? false,
      targets,
      attachments,
    });

    const saved = await this.announcementRepo.save(announcement);

    if (saved.status === AnnouncementStatus.SENT) {
      await this.syncReadStatusesForAnnouncement(saved.id);
    }

    return saved;
  }
  // ===============================================================

  async findAllUser(userId: string, query: QueryInboxDto) {
    const { page = 1, limit = 10, isRead } = query;
    const skip = (page - 1) * limit;

    const qb = this.announcementRepo.createQueryBuilder('announcement')
      .leftJoinAndSelect('announcement.readStatuses', 'rs', 'rs.userId = :userId', { userId })
      .where('announcement.status = :status', { status: AnnouncementStatus.SENT })
      .andWhere('rs.id IS NOT NULL')
      .leftJoinAndSelect('announcement.sender', 'sender')
      .orderBy('announcement.isPinned', 'DESC')
      .addOrderBy('announcement.sentAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (typeof isRead === 'boolean') {
      qb.andWhere(isRead ? 'rs.readAt IS NOT NULL' : 'rs.readAt IS NULL');
    }

    const [items, total] = await qb.getManyAndCount();

    const mappedItems = items.map((announcement: any) => {
      const readStatus = Array.isArray(announcement.readStatuses) ? announcement.readStatuses[0] : null;

      return {
        ...announcement,
        isRead: Boolean(readStatus?.readAt),
        readAt: readStatus?.readAt || null,
        confirmedAt: readStatus?.confirmedAt || null,

        // 🔥 FIX FIELD SAI
        require_confirmation: Boolean(announcement?.requireConfirmation),
        allow_comment: Boolean(announcement?.allowComment),
      };
    });

    return { items: mappedItems, total, page, limit };
  }

  async update(id: string, dto: Partial<CreateAnnouncementDto>) {
    const announcement = await this.announcementRepo.findOne({ where: { id } });
    if (!announcement) throw new NotFoundException();

    const patch: Partial<AnnouncementEntity> = {};

    if (dto?.title !== undefined) patch.title = dto.title;
    if (dto?.content !== undefined) patch.content = dto.content;

    if (dto?.priority !== undefined) patch.priority = dto.priority;
    if (dto?.category !== undefined) patch.category = dto.category ?? null;

    if (
      dto?.requireConfirmation !== undefined ||
      dto?.requireConfirm !== undefined
    ) {
      patch.requireConfirmation = Boolean(
        dto.requireConfirmation ?? dto.requireConfirm,
      );
    }

    if (dto?.allowComment !== undefined)
      patch.allowComment = Boolean(dto.allowComment);

    if (dto?.isPinned !== undefined)
      patch.isPinned = Boolean(dto.isPinned);

    if (dto && Object.prototype.hasOwnProperty.call(dto, 'scheduledAt')) {
      const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
      patch.scheduledAt = scheduledAt;

      if (scheduledAt) {
        patch.status = AnnouncementStatus.SCHEDULED;
        patch.sentAt = null;
      } else if (announcement.status === AnnouncementStatus.SCHEDULED) {
        patch.status = AnnouncementStatus.SENT;
        patch.sentAt = new Date();
      }
    }

    const updated = await this.announcementRepo.save({
      ...announcement,
      ...patch,
      updatedAt: new Date(),
    });

    if (Array.isArray(dto?.targets)) {
      await this.targetRepo.delete({ announcementId: id });

      if (dto.targets.length) {
        const targetRows = dto.targets
          .map((t) =>
            this.targetRepo.create({
              announcementId: id,
              targetType: t.targetType as TargetType,
              targetId: t.targetId ? String(t.targetId) : null,
            }),
          )
          .filter(Boolean);

        if (targetRows.length) {
          await this.targetRepo.save(targetRows);
        }
      }
    }

    if (Array.isArray(dto?.attachments)) {
      await this.attachmentRepo.delete({ announcementId: id });

      if (dto.attachments.length) {
        const attachmentRows = dto.attachments
          .map((a) =>
            this.attachmentRepo.create({
              announcementId: id,
              fileUrl: a.fileUrl,
              fileName: a.fileName,
              type: a.type || null,
            }),
          )
          .filter(Boolean);
        if (attachmentRows.length) {
          await this.attachmentRepo.save(attachmentRows);
        }
      }
    }

    const shouldSyncReadStatus =
      updated.status === AnnouncementStatus.SENT &&
      (Array.isArray(dto?.targets) ||
        Object.prototype.hasOwnProperty.call(dto || {}, 'scheduledAt'));

    if (shouldSyncReadStatus) {
      await this.syncReadStatusesForAnnouncement(id);
    }

    return this.announcementRepo.findOne({
      where: { id },
      relations: ['targets', 'attachments'],
    });
  }

  async findAllAdmin(query: QueryAnnouncementDto) {
    const { page = 1, limit = 10, status, priority, search, category } = query;
    const skip = (page - 1) * limit;

    const qb = this.announcementRepo
      .createQueryBuilder('announcement')
      .leftJoinAndSelect('announcement.sender', 'sender')
      .orderBy('announcement.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (status) qb.andWhere('announcement.status = :status', { status });
    if (priority) qb.andWhere('announcement.priority = :priority', { priority });
    if (category) qb.andWhere('announcement.category = :category', { category });
    if (search) {
      qb.andWhere('(announcement.title LIKE :search OR announcement.content LIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    const ids = items.map((x) => x.id).filter(Boolean);
    const countMap = new Map<string, { recipientCount: number; readCount: number }>();

    if (ids.length) {
      const missingIds = await this.readStatusRepo
        .createQueryBuilder('rs')
        .select('a.id', 'announcementId')
        .from(AnnouncementEntity, 'a')
        .leftJoin(AnnouncementReadStatusEntity, 'rs2', 'rs2.notification_id = a.id')
        .where('a.id IN (:...ids)', { ids })
        .andWhere('a.status = :status', { status: AnnouncementStatus.SENT })
        .groupBy('a.id')
        .having('COUNT(rs2.id) = 0')
        .getRawMany();

      for (const row of missingIds) {
        const announcementId = String(row.announcementId || '');
        if (announcementId) {
          await this.syncReadStatusesForAnnouncement(announcementId);
        }
      }

      const rows = await this.readStatusRepo
        .createQueryBuilder('rs')
        .select('rs.announcementId', 'announcementId')
        .addSelect('COUNT(1)', 'recipientCount')
        .addSelect(
          'SUM(CASE WHEN rs.readAt IS NOT NULL THEN 1 ELSE 0 END)',
          'readCount',
        )
        .where('rs.announcementId IN (:...ids)', { ids })
        .groupBy('rs.announcementId')
        .getRawMany();

      rows.forEach((row: any) => {
        countMap.set(String(row.announcementId), {
          recipientCount: Number(row.recipientCount) || 0,
          readCount: Number(row.readCount) || 0,
        });
      });
    }

    const enrichedItems = items.map((item: any) => {
      const stats = countMap.get(String(item.id)) || { recipientCount: 0, readCount: 0 };
      const readRate =
        stats.recipientCount > 0 ? (stats.readCount / stats.recipientCount) * 100 : 0;

      return {
        ...item,
        recipientCount: stats.recipientCount,
        readCount: stats.readCount,
        readRate,
      };
    });

    return { items: enrichedItems, total, page, limit };
  }

  async findOne(id: string, userId: string, isAdmin = false) {
    const announcement = await this.announcementRepo.findOne({
      where: { id },
      relations: ['sender', 'targets', 'attachments'],
    });
    if (!announcement) throw new NotFoundException('Announcement not found');

    let readStatus: AnnouncementReadStatusEntity | null = null;
    if (!isAdmin) {
      readStatus = await this.readStatusRepo.findOne({
        where: { announcementId: id, userId },
      });
      if (!readStatus) throw new ForbiddenException('No permission to view this announcement');

      if (!readStatus.readAt) {
        readStatus.readAt = new Date();
        await this.readStatusRepo.save(readStatus);
      }
    }

    return {
      ...announcement,
      isRead: isAdmin ? undefined : Boolean(readStatus?.readAt),
      readAt: isAdmin ? undefined : readStatus?.readAt ?? null,
      confirmedAt: isAdmin ? undefined : readStatus?.confirmedAt ?? null,
      require_confirmation: Boolean(announcement.requireConfirmation),
      allow_comment: Boolean(announcement.allowComment),
    };
  }

  async delete(id: string) {
    const announcement = await this.announcementRepo.findOne({ where: { id } });
    if (!announcement) throw new NotFoundException('Announcement not found');
    await this.announcementRepo.remove(announcement);
    return { success: true };
  }

  async getStatistics(id: string) {
    const announcement = await this.announcementRepo.findOne({ where: { id } });
    if (!announcement) throw new NotFoundException('Announcement not found');

    const [total, read, confirmed] = await Promise.all([
      this.readStatusRepo.count({ where: { announcementId: id } }),
      this.readStatusRepo
        .createQueryBuilder('rs')
        .where('rs.announcementId = :id', { id })
        .andWhere('rs.readAt IS NOT NULL')
        .getCount(),
      this.readStatusRepo
        .createQueryBuilder('rs')
        .where('rs.announcementId = :id', { id })
        .andWhere('rs.confirmedAt IS NOT NULL')
        .getCount(),
    ]);

    return {
      totalRecipients: total,
      readCount: read,
      unreadCount: Math.max(total - read, 0),
      confirmedCount: confirmed,
    };
  }

  async getReadStatusDetails(id: string) {
    const exists = await this.announcementRepo.exist({ where: { id } });
    if (!exists) throw new NotFoundException('Announcement not found');

    return this.readStatusRepo.find({
      where: { announcementId: id },
      relations: ['user'],
      order: { receivedAt: 'DESC' },
    });
  }

  async sendReminders(id: string) {
    const exists = await this.announcementRepo.exist({ where: { id } });
    if (!exists) throw new NotFoundException('Announcement not found');

    const unreadItems = await this.readStatusRepo.find({
      where: { announcementId: id, readAt: IsNull() },
      select: { userId: true, announcementId: true, id: true },
    });

    return {
      announcementId: id,
      remindedCount: unreadItems.length,
      userIds: unreadItems.map((x) => x.userId),
    };
  }

  async togglePin(id: string, isPinned: boolean) {
    const announcement = await this.announcementRepo.findOne({ where: { id } });
    if (!announcement) throw new NotFoundException('Announcement not found');
    announcement.isPinned = Boolean(isPinned);
    announcement.updatedAt = new Date();
    return this.announcementRepo.save(announcement);
  }

  async toggleComment(id: string, allowComment: boolean) {
    const announcement = await this.announcementRepo.findOne({ where: { id } });
    if (!announcement) throw new NotFoundException('Announcement not found');
    announcement.allowComment = Boolean(allowComment);
    announcement.updatedAt = new Date();
    return this.announcementRepo.save(announcement);
  }

  async getUnreadCount(userId: string) {
    const unread = await this.readStatusRepo
      .createQueryBuilder('rs')
      .innerJoin('rs.announcement', 'a')
      .where('rs.userId = :userId', { userId })
      .andWhere('rs.readAt IS NULL')
      .andWhere('a.status = :status', { status: AnnouncementStatus.SENT })
      .getCount();

    return { unreadCount: unread };
  }

  async markAllAsRead(userId: string) {
    const unreadCount = await this.readStatusRepo
      .createQueryBuilder('rs')
      .innerJoin('rs.announcement', 'a')
      .where('rs.userId = :userId', { userId })
      .andWhere('rs.readAt IS NULL')
      .andWhere('a.status = :status', { status: AnnouncementStatus.SENT })
      .getCount();

    if (!unreadCount) return { updated: 0 };

    await this.readStatusRepo.query(
      `
        UPDATE rs
        SET rs.read_at = GETDATE()
        FROM ann_reads rs
        INNER JOIN ann_notifications a ON a.id = rs.notification_id
        WHERE rs.user_id = @0
          AND rs.read_at IS NULL
          AND a.status = @1
      `,
      [userId, AnnouncementStatus.SENT],
    );

    return { updated: unreadCount };
  }

  async getInboxStatistics(userId: string) {
    const [total, unread, confirmed] = await Promise.all([
      this.readStatusRepo
        .createQueryBuilder('rs')
        .innerJoin('rs.announcement', 'a')
        .where('rs.userId = :userId', { userId })
        .andWhere('a.status = :status', { status: AnnouncementStatus.SENT })
        .getCount(),
      this.readStatusRepo
        .createQueryBuilder('rs')
        .innerJoin('rs.announcement', 'a')
        .where('rs.userId = :userId', { userId })
        .andWhere('a.status = :status', { status: AnnouncementStatus.SENT })
        .andWhere('rs.readAt IS NULL')
        .getCount(),
      this.readStatusRepo
        .createQueryBuilder('rs')
        .innerJoin('rs.announcement', 'a')
        .where('rs.userId = :userId', { userId })
        .andWhere('a.status = :status', { status: AnnouncementStatus.SENT })
        .andWhere('rs.confirmedAt IS NOT NULL')
        .getCount(),
    ]);

    return {
      total,
      unread,
      read: Math.max(total - unread, 0),
      confirmed,
    };
  }

  async getNeighbors(id: string, userId: string) {
    const rows = await this.announcementRepo
      .createQueryBuilder('a')
      .innerJoin('a.readStatuses', 'rs', 'rs.userId = :userId', { userId })
      .where('a.status = :status', { status: AnnouncementStatus.SENT })
      .select(['a.id'])
      .orderBy('a.isPinned', 'DESC')
      .addOrderBy('a.sentAt', 'DESC')
      .addOrderBy('a.createdAt', 'DESC')
      .getMany();

    const ids = rows.map((r) => r.id);
    const index = ids.indexOf(id);
    if (index === -1) throw new NotFoundException('Announcement not found in inbox');

    return {
      prevId: index > 0 ? ids[index - 1] : null,
      previousId: index > 0 ? ids[index - 1] : null,
      nextId: index < ids.length - 1 ? ids[index + 1] : null,
    };
  }

  async confirmRead(id: string, userId: string) {
    const announcement = await this.announcementRepo.findOne({ where: { id } });
    if (!announcement) throw new NotFoundException('Announcement not found');

    const readStatus = await this.readStatusRepo.findOne({
      where: { announcementId: id, userId },
    });
    if (!readStatus) throw new ForbiddenException('No permission to confirm this announcement');

    const now = new Date();
    if (!readStatus.readAt) readStatus.readAt = now;
    readStatus.confirmedAt = now;
    await this.readStatusRepo.save(readStatus);

    return {
      success: true,
      confirmedAt: readStatus.confirmedAt,
      readAt: readStatus.readAt,
      requireConfirmation: Boolean(announcement.requireConfirmation),
    };
  }

  private chunkArray<T>(items: T[], size: number): T[][] {
    if (!items.length || size <= 0) return [];
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  }

  private async resolveRecipientUserIds(announcement: AnnouncementEntity): Promise<string[]> {
    const allUsers = await this.userRepo.find({ select: { id: true, position: true } as any });
    const allIds = allUsers.map((u: any) => String(u.id)).filter(Boolean);

    const targets = Array.isArray(announcement.targets) ? announcement.targets : [];
    if (!targets.length || targets.some((t: any) => String(t.targetType).toLowerCase() === TargetType.ALL)) {
      return Array.from(new Set(allIds));
    }

    const directUserIds = targets
      .filter((t: any) => String(t.targetType).toLowerCase() === TargetType.USER)
      .map((t: any) => String(t.targetId || ''))
      .filter(Boolean);

    const deptIds = targets
      .filter((t: any) => String(t.targetType).toLowerCase() === TargetType.DEPARTMENT)
      .map((t: any) => String(t.targetId || ''))
      .filter(Boolean);

    const roleNames = targets
      .filter((t: any) => String(t.targetType).toLowerCase() === TargetType.ROLE)
      .map((t: any) => String(t.targetId || ''))
      .filter(Boolean);

    let idsFromDept: string[] = [];
    if (deptIds.length) {
      const usersByDept = await this.userRepo
        .createQueryBuilder('u')
        .select('u.id', 'id')
        .where('u.parent IN (:...deptIds)', { deptIds })
        .getRawMany();
      idsFromDept = usersByDept.map((u: any) => String(u.id || '')).filter(Boolean);
    }

    const idsFromRole = allUsers
      .filter((u: any) => roleNames.includes(String(u.position || '')))
      .map((u: any) => String(u.id || ''))
      .filter(Boolean);

    return Array.from(new Set([...directUserIds, ...idsFromDept, ...idsFromRole]));
  }

  private async syncReadStatusesForAnnouncement(announcementId: string) {
    const announcement = await this.announcementRepo.findOne({
      where: { id: announcementId },
      relations: ['targets'],
    });
    if (!announcement || announcement.status !== AnnouncementStatus.SENT) return;

    const recipientIds = await this.resolveRecipientUserIds(announcement);
    if (!recipientIds.length) return;

    const existingRows = await this.readStatusRepo.find({
      where: {
        announcementId,
        userId: In(recipientIds),
      },
      select: { userId: true },
    });
    const existingIds = new Set(existingRows.map((x) => String(x.userId)));
    const missingIds = recipientIds.filter((id) => !existingIds.has(String(id)));
    if (!missingIds.length) return;

    const chunks = this.chunkArray(missingIds, 300);
    for (const chunk of chunks) {
      const rows = chunk.map((userId) => ({
        announcementId,
        userId,
        readAt: null,
        confirmedAt: null,
      }));
      await this.readStatusRepo.insert(rows as any);
    }
  }

  private async backfillMissingReadStatusesForSentAnnouncements(limit = 200) {
    const rows = await this.announcementRepo.query(
      `
        SELECT TOP (${limit}) a.id
        FROM ann_notifications a
        WHERE a.status = @0
          AND NOT EXISTS (
            SELECT 1
            FROM ann_reads r
            WHERE r.notification_id = a.id
          )
        ORDER BY a.created_at DESC
      `,
      [AnnouncementStatus.SENT],
    );

    for (const row of rows || []) {
      const announcementId = String(row?.id || '');
      if (!announcementId) continue;
      await this.syncReadStatusesForAnnouncement(announcementId);
    }
  }
}
