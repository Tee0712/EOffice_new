import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AlertRuleEntity } from './alert-rule.entity';

@Entity('mm_alert_rule_recipients')
export class AlertRuleRecipientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', name: 'alert_rule_id' })
  @Index()
  alertRuleId: string;

  @Column({ type: 'nvarchar', name: 'user_id' })
  userId: string;

  @ManyToOne(() => AlertRuleEntity, (r) => r.recipients)
  @JoinColumn({ name: 'alert_rule_id' })
  rule: AlertRuleEntity;
}

