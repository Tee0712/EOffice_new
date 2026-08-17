import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ReportRecipientEntity } from './report-recipient.entity';
import { ReportSendHistoryEntity } from './report-send-history.entity';

export enum ReportFrequency {
  NGAY = 'ngay',
  TUAN = 'tuan',
  THANG = 'thang',
  SU_KIEN = 'su_kien',
}

export enum ReportStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
}

export enum ReportLanguage {
  VI = 'vi',
  EN = 'en',
}

export enum ReportOutputFormat {
  EMAIL_HTML = 'email_html',
  PDF = 'pdf',
  WORD = 'word',
}

@Entity('mm_report_templates')
export class ReportTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'nvarchar', length: 20, default: ReportFrequency.NGAY })
  frequency: ReportFrequency;

  @Column({ type: 'nvarchar', length: 10, nullable: true, name: 'send_time' })
  sendTime: string | null;

  @Column({ type: 'nvarchar', length: 20, default: ReportStatus.DRAFT })
  status: ReportStatus;

  @Column({ type: 'nvarchar', length: 5, default: ReportLanguage.VI })
  language: ReportLanguage;

  @Column({ type: 'nvarchar', length: 50, nullable: true, name: 'data_range' })
  dataRange: string | null;

  @Column({ type: 'nvarchar', length: 20, default: ReportOutputFormat.EMAIL_HTML, name: 'output_format' })
  outputFormat: ReportOutputFormat;

  // JSON: { tong_quan_kpi: true, canh_bao: true, top5: true, bieu_do: true, tu_khoa: true }
  @Column({ type: 'nvarchar', length: 500, nullable: true, name: 'sections_enabled' })
  sectionsEnabled: string | null;

  @Column({ type: 'int', default: 0, name: 'send_count_total' })
  sendCountTotal: number;

  @OneToMany(() => ReportRecipientEntity, (r) => r.template, { cascade: true })
  recipients: ReportRecipientEntity[];

  @OneToMany(() => ReportSendHistoryEntity, (h) => h.template)
  history: ReportSendHistoryEntity[];

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}
