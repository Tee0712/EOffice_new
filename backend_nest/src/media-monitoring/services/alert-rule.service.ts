import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertRuleEntity } from '../entities/alert-rule.entity';
import { AlertRuleRecipientEntity } from '../entities/alert-rule-recipient.entity';
import { AlertEventEntity } from '../entities/alert-event.entity';
import { CreateAlertRuleDto, UpdateAlertRuleDto, QueryAlertRuleDto } from '../dto/media.dto';

@Injectable()
export class AlertRuleService implements OnModuleInit {
  constructor(
    @InjectRepository(AlertRuleEntity, 'mssqlConnection')
    private readonly ruleRepo: Repository<AlertRuleEntity>,
    @InjectRepository(AlertRuleRecipientEntity, 'mssqlConnection')
    private readonly recipientRepo: Repository<AlertRuleRecipientEntity>,
    @InjectRepository(AlertEventEntity, 'mssqlConnection')
    private readonly eventRepo: Repository<AlertEventEntity>,
  ) {}

  async onModuleInit() {
    await this.ensureTables();
  }

  private async ensureTables() {
    await this.ruleRepo.query(`
      IF OBJECT_ID('dbo.mm_alert_rules', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mm_alert_rules (
          id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
          name NVARCHAR(255) NOT NULL,
          condition_type NVARCHAR(50) NOT NULL,
          threshold_value FLOAT NULL,
          severity NVARCHAR(20) NOT NULL DEFAULT 'trung_binh',
          is_active BIT NOT NULL DEFAULT 1,
          channels NVARCHAR(500) NULL,
          quiet_hours_start INT NULL,
          quiet_hours_end INT NULL,
          apply_weekend BIT NOT NULL DEFAULT 1,
          always_send_critical BIT NOT NULL DEFAULT 1,
          last_triggered_at DATETIME NULL,
          trigger_count_today INT NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE()
        );
      END;

      IF OBJECT_ID('dbo.mm_alert_rule_recipients', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mm_alert_rule_recipients (
          id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
          alert_rule_id NVARCHAR(100) NOT NULL,
          user_id NVARCHAR(100) NOT NULL
        );
        CREATE INDEX IX_mm_arr_rule_id ON dbo.mm_alert_rule_recipients(alert_rule_id);
      END;

      IF OBJECT_ID('dbo.mm_alert_events', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mm_alert_events (
          id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
          alert_rule_id NVARCHAR(100) NOT NULL,
          article_id NVARCHAR(100) NULL,
          triggered_at DATETIME NOT NULL DEFAULT GETDATE(),
          message NVARCHAR(1000) NOT NULL,
          is_resolved BIT NOT NULL DEFAULT 0,
          resolved_at DATETIME NULL
        );
        CREATE INDEX IX_mm_ae_rule_id ON dbo.mm_alert_events(alert_rule_id);
        CREATE INDEX IX_mm_ae_triggered_at ON dbo.mm_alert_events(triggered_at DESC);
      END;
    `);
  }

  async create(dto: CreateAlertRuleDto): Promise<AlertRuleEntity> {
    const { recipientIds, channels, ...ruleData } = dto;
    const rule = this.ruleRepo.create({
      ...ruleData,
      channels: channels ? JSON.stringify(channels) : null,
    });
    const saved = await this.ruleRepo.save(rule);

    if (recipientIds?.length) {
      const recs = recipientIds.map((uid) =>
        this.recipientRepo.create({ alertRuleId: saved.id, userId: uid }),
      );
      await this.recipientRepo.save(recs);
    }
    return this.findOne(saved.id);
  }

  async findAll(query: QueryAlertRuleDto) {
    const { isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    const [items, total] = await this.ruleRepo.findAndCount({
      where,
      relations: ['recipients'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<AlertRuleEntity> {
    const rule = await this.ruleRepo.findOne({
      where: { id },
      relations: ['recipients'],
    });
    if (!rule) throw new NotFoundException(`Alert rule ${id} not found`);
    return rule;
  }

  async update(id: string, dto: UpdateAlertRuleDto): Promise<AlertRuleEntity> {
    const { channels, ...rest } = dto;
    await this.findOne(id);
    const update: any = { ...rest };
    if (channels !== undefined) update.channels = JSON.stringify(channels);
    await this.ruleRepo.update(id, update);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    await this.findOne(id);
    await this.recipientRepo.delete({ alertRuleId: id });
    await this.ruleRepo.delete(id);
    return { success: true };
  }

  async toggle(id: string, isActive: boolean): Promise<AlertRuleEntity> {
    await this.ruleRepo.update(id, { isActive });
    return this.findOne(id);
  }

  async getEvents(alertRuleId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = alertRuleId ? { alertRuleId } : {};
    const [items, total] = await this.eventRepo.findAndCount({
      where,
      order: { triggeredAt: 'DESC' },
      skip,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async resolveEvent(eventId: string): Promise<AlertEventEntity> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Alert event ${eventId} not found`);
    event.isResolved = true;
    event.resolvedAt = new Date();
    return this.eventRepo.save(event);
  }
}
