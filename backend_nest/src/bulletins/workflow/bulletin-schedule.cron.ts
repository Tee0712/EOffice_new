import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { BulletinApprovalHistoryEntity, BulletinAction } from './entities/history.entity';
import { BulletinEntity, BulletinStatus } from './entities/bulletin.entity';

@Injectable()
export class BulletinScheduleCronService {
  private readonly logger = new Logger(BulletinScheduleCronService.name);

  constructor(
    @InjectRepository(BulletinEntity, 'mssqlConnection')
    private readonly bulletinRepository: Repository<BulletinEntity>,
    @InjectRepository(BulletinApprovalHistoryEntity, 'mssqlConnection')
    private readonly historyRepository: Repository<BulletinApprovalHistoryEntity>,
  ) { }

  @Cron('*/30 * * * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleCron(): Promise<void> {
    await this.autoPublish();
    await this.autoUnpublish();
  }

  private async autoPublish(): Promise<void> {
    const now = new Date();
    const bulletins = await this.bulletinRepository.find({
      where: {
        status: BulletinStatus.APPROVED,
        scheduledPublishAt: LessThanOrEqual(now),
      },
    });

    for (const bulletin of bulletins) {
      try {
        bulletin.status = BulletinStatus.PUBLISHED;
        bulletin.scheduledPublishAt = null;
        await this.bulletinRepository.save(bulletin);

        await this.historyRepository.save(
          this.historyRepository.create({
            bulletin_id: bulletin.id,
            actor_id: 'system-scheduler',
            step_order: Number(bulletin.current_step || 1),
            action: BulletinAction.PUBLISHED,
            comment: 'Auto published by scheduler',
          }),
        );
      } catch (error) {
        this.logger.error(`[${bulletin.id}] Auto publish failed: ${error?.message || error}`);
      }
    }
  }

  private async autoUnpublish(): Promise<void> {
    const now = new Date();
    const bulletins = await this.bulletinRepository.find({
      where: {
        status: BulletinStatus.PUBLISHED,
        scheduledUnpublishAt: LessThanOrEqual(now),
      },
    });

    for (const bulletin of bulletins) {
      try {
        bulletin.status = BulletinStatus.APPROVED;
        bulletin.scheduledUnpublishAt = null;
        await this.bulletinRepository.save(bulletin);

        await this.historyRepository.save(
          this.historyRepository.create({
            bulletin_id: bulletin.id,
            actor_id: 'system-scheduler',
            step_order: Number(bulletin.current_step || 1),
            action: BulletinAction.UNPUBLISHED,
            comment: 'Auto unpublished by scheduler',
          }),
        );
      } catch (error) {
        this.logger.error(`[${bulletin.id}] Auto unpublish failed: ${error?.message || error}`);
      }
    }
  }
}

