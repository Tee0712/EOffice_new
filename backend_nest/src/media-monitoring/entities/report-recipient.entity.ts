import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ReportTemplateEntity } from './report-template.entity';

@Entity('mm_report_recipients')
export class ReportRecipientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', name: 'report_template_id' })
  @Index()
  reportTemplateId: string;

  @Column({ type: 'nvarchar', name: 'user_id' })
  userId: string;

  @ManyToOne(() => ReportTemplateEntity, (t) => t.recipients)
  @JoinColumn({ name: 'report_template_id' })
  template: ReportTemplateEntity;
}

