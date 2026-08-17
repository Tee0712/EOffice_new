import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ReportTemplateEntity } from './report-template.entity';

export enum SendHistoryStatus {
  DA_GUI = 'da_gui',
  THAT_BAI = 'that_bai',
}

@Entity('mm_report_send_history')
export class ReportSendHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', name: 'report_template_id' })
  @Index()
  reportTemplateId: string;

  @Column({ type: 'datetime', name: 'sent_at', default: () => 'GETDATE()' })
  sentAt: Date;

  @Column({ type: 'int', default: 0, name: 'recipient_count' })
  recipientCount: number;

  @Column({ type: 'int', default: 0, name: 'open_count' })
  openCount: number;

  @Column({ type: 'nvarchar', length: 20, default: SendHistoryStatus.DA_GUI })
  status: SendHistoryStatus;

  // JSON snapshot of report data at send time
  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'snapshot_data' })
  snapshotData: string | null;

  @ManyToOne(() => ReportTemplateEntity, (t) => t.history)
  @JoinColumn({ name: 'report_template_id' })
  template: ReportTemplateEntity;
}

