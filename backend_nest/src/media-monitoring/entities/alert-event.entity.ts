import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AlertRuleEntity } from './alert-rule.entity';

@Entity('mm_alert_events')
export class AlertEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', name: 'alert_rule_id' })
  @Index()
  alertRuleId: string;

  @Column({ type: 'nvarchar', nullable: true, name: 'article_id' })
  articleId: string | null;

  @Column({ type: 'datetime', name: 'triggered_at', default: () => 'GETDATE()' })
  triggeredAt: Date;

  @Column({ type: 'nvarchar', length: 1000 })
  message: string;

  @Column({ type: 'bit', default: 0, name: 'is_resolved' })
  isResolved: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'resolved_at' })
  resolvedAt: Date | null;

  @ManyToOne(() => AlertRuleEntity, (r) => r.events)
  @JoinColumn({ name: 'alert_rule_id' })
  rule: AlertRuleEntity;
}

