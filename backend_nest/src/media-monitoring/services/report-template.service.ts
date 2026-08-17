import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportTemplateEntity, ReportStatus } from '../entities/report-template.entity';
import { ReportRecipientEntity } from '../entities/report-recipient.entity';
import { ReportSendHistoryEntity, SendHistoryStatus } from '../entities/report-send-history.entity';
import { CreateReportTemplateDto, UpdateReportTemplateDto, QueryReportTemplateDto } from '../dto/media.dto';

@Injectable()
export class ReportTemplateService implements OnModuleInit {
  constructor(
    @InjectRepository(ReportTemplateEntity, 'mssqlConnection')
    private readonly templateRepo: Repository<ReportTemplateEntity>,
    @InjectRepository(ReportRecipientEntity, 'mssqlConnection')
    private readonly recipientRepo: Repository<ReportRecipientEntity>,
    @InjectRepository(ReportSendHistoryEntity, 'mssqlConnection')
    private readonly historyRepo: Repository<ReportSendHistoryEntity>,
  ) {}

  async onModuleInit() {
    await this.ensureTables();
  }

  private async ensureTables() {
    await this.templateRepo.query(`
      IF OBJECT_ID('dbo.mm_notification_channels', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mm_notification_channels (
          id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
          type NVARCHAR(20) NOT NULL,
          label NVARCHAR(255) NOT NULL,
          config NVARCHAR(MAX) NULL,
          status NVARCHAR(20) NOT NULL DEFAULT 'connected',
          is_enabled BIT NOT NULL DEFAULT 1
        );
      END;

      IF OBJECT_ID('dbo.mm_report_templates', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mm_report_templates (
          id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
          name NVARCHAR(255) NOT NULL,
          frequency NVARCHAR(20) NOT NULL DEFAULT 'ngay',
          send_time NVARCHAR(10) NULL,
          status NVARCHAR(20) NOT NULL DEFAULT 'draft',
          language NVARCHAR(5) NOT NULL DEFAULT 'vi',
          data_range NVARCHAR(50) NULL,
          output_format NVARCHAR(20) NOT NULL DEFAULT 'email_html',
          sections_enabled NVARCHAR(500) NULL,
          send_count_total INT NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE()
        );
      END;

      IF OBJECT_ID('dbo.mm_report_recipients', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mm_report_recipients (
          id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
          report_template_id NVARCHAR(100) NOT NULL,
          user_id NVARCHAR(100) NOT NULL
        );
        CREATE INDEX IX_mm_rr_template_id ON dbo.mm_report_recipients(report_template_id);
      END;

      IF OBJECT_ID('dbo.mm_report_send_history', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mm_report_send_history (
          id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
          report_template_id NVARCHAR(100) NOT NULL,
          sent_at DATETIME NOT NULL DEFAULT GETDATE(),
          recipient_count INT NOT NULL DEFAULT 0,
          open_count INT NOT NULL DEFAULT 0,
          status NVARCHAR(20) NOT NULL DEFAULT 'da_gui',
          snapshot_data NVARCHAR(MAX) NULL
        );
        CREATE INDEX IX_mm_rsh_template_id ON dbo.mm_report_send_history(report_template_id);
      END;
    `);
  }

  async create(dto: CreateReportTemplateDto): Promise<ReportTemplateEntity> {
    const { recipientIds, sectionsEnabled, ...rest } = dto;
    const template = this.templateRepo.create({
      ...rest,
      sectionsEnabled: sectionsEnabled ? JSON.stringify(sectionsEnabled) : null,
    });
    const saved = await this.templateRepo.save(template);

    if (recipientIds?.length) {
      const recs = recipientIds.map((uid) =>
        this.recipientRepo.create({ reportTemplateId: saved.id, userId: uid }),
      );
      await this.recipientRepo.save(recs);
    }
    return this.findOne(saved.id);
  }

  async findAll(query: QueryReportTemplateDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const [items, total] = await this.templateRepo.findAndCount({
      relations: ['recipients', 'history'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<ReportTemplateEntity> {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: ['recipients', 'history'],
    });
    if (!template) throw new NotFoundException(`Report template ${id} not found`);
    return template;
  }

  async update(id: string, dto: UpdateReportTemplateDto): Promise<ReportTemplateEntity> {
    const { recipientIds, sectionsEnabled, ...rest } = dto;
    await this.findOne(id);
    const update: any = { ...rest };
    if (sectionsEnabled !== undefined) update.sectionsEnabled = JSON.stringify(sectionsEnabled);
    await this.templateRepo.update(id, update);

    if (recipientIds !== undefined) {
      await this.recipientRepo.delete({ reportTemplateId: id });
      if (recipientIds.length > 0) {
        const recs = recipientIds.map((uid) =>
          this.recipientRepo.create({ reportTemplateId: id, userId: uid }),
        );
        await this.recipientRepo.save(recs);
      }
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    await this.findOne(id);
    await this.recipientRepo.delete({ reportTemplateId: id });
    await this.templateRepo.delete(id);
    return { success: true };
  }

  async duplicate(id: string): Promise<ReportTemplateEntity> {
    const original = await this.findOne(id);
    const copy = this.templateRepo.create({
      name: `${original.name} (copy)`,
      frequency: original.frequency,
      sendTime: original.sendTime,
      status: ReportStatus.DRAFT,
      language: original.language,
      dataRange: original.dataRange,
      outputFormat: original.outputFormat,
      sectionsEnabled: original.sectionsEnabled,
      sendCountTotal: 0,
    });
    const savedResult = await this.templateRepo.save(copy);
    const saved = Array.isArray(savedResult) ? savedResult[0] : savedResult;

    if (original.recipients?.length) {
      const recs = original.recipients.map((r) =>
        this.recipientRepo.create({ reportTemplateId: saved.id, userId: r.userId }),
      );
      await this.recipientRepo.save(recs);
    }
    return this.findOne(saved.id);
  }

  async send(id: string): Promise<ReportSendHistoryEntity> {
    const template = await this.findOne(id);
    const recipientCount = template.recipients?.length ?? 0;

    const historyEntry = this.historyRepo.create({
      reportTemplateId: id,
      recipientCount,
      status: SendHistoryStatus.DA_GUI,
      snapshotData: JSON.stringify({ sentAt: new Date(), templateName: template.name }),
    });
    const saved = await this.historyRepo.save(historyEntry);
    await this.templateRepo.update(id, { sendCountTotal: (template.sendCountTotal ?? 0) + 1 });
    return saved;
  }

  async getHistory(templateId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = templateId ? { reportTemplateId: templateId } : {};
    const [items, total] = await this.historyRepo.findAndCount({
      where,
      order: { sentAt: 'DESC' },
      skip,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async resend(historyId: string): Promise<ReportSendHistoryEntity> {
    const original = await this.historyRepo.findOne({ where: { id: historyId } });
    if (!original) throw new NotFoundException(`History entry ${historyId} not found`);
    const retried = this.historyRepo.create({
      reportTemplateId: original.reportTemplateId,
      recipientCount: original.recipientCount,
      status: SendHistoryStatus.DA_GUI,
      snapshotData: original.snapshotData,
    });
    return this.historyRepo.save(retried);
  }
}
