import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AlertRuleRecipientEntity } from './alert-rule-recipient.entity';
import { AlertEventEntity } from './alert-event.entity';

export enum AlertConditionType {
  SENTIMENT_TIEU_CUC = 'sentiment_tieu_cuc',
  DOT_BIEN = 'dot_bien',
  TU_KHOA_RUI_RO = 'tu_khoa_rui_ro',
  NGUON_QUAN_TRONG = 'nguon_quan_trong',
  VUOT_NGUONG = 'vuot_nguong',
}

export enum AlertSeverity {
  NGHIEM_TRONG = 'nghiem_trong',
  CAO = 'cao',
  TRUNG_BINH = 'trung_binh',
}

@Entity('mm_alert_rules')
export class AlertRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'nvarchar', length: 50, name: 'condition_type' })
  @Index()
  conditionType: AlertConditionType;

  @Column({ type: 'float', nullable: true, name: 'threshold_value' })
  thresholdValue: number | null;

  @Column({ type: 'nvarchar', length: 20, default: AlertSeverity.TRUNG_BINH })
  severity: AlertSeverity;

  @Column({ type: 'bit', default: 1, name: 'is_active' })
  isActive: boolean;

  // JSON array: ['email','inapp','zalo','sms']
  @Column({ type: 'nvarchar', length: 500, nullable: true })
  channels: string | null;

  @Column({ type: 'int', nullable: true, name: 'quiet_hours_start' })
  quietHoursStart: number | null;

  @Column({ type: 'int', nullable: true, name: 'quiet_hours_end' })
  quietHoursEnd: number | null;

  @Column({ type: 'bit', default: 1, name: 'apply_weekend' })
  applyWeekend: boolean;

  @Column({ type: 'bit', default: 1, name: 'always_send_critical' })
  alwaysSendCritical: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'last_triggered_at' })
  lastTriggeredAt: Date | null;

  @Column({ type: 'int', default: 0, name: 'trigger_count_today' })
  triggerCountToday: number;

  @OneToMany(() => AlertRuleRecipientEntity, (r) => r.rule, { cascade: true })
  recipients: AlertRuleRecipientEntity[];

  @OneToMany(() => AlertEventEntity, (e) => e.rule)
  events: AlertEventEntity[];

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}
