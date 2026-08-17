import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EventNotificationEntity } from './event-notification.entity';
import { NotificationRecipientEntity } from './notification-recipient.entity';

export enum ReminderChannel {
  SYSTEM = 'SYSTEM',
  EMAIL = 'EMAIL',
}

export enum ReminderResult {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum ReminderTrigger {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

@Entity('reminder_logs')
export class ReminderLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'notification_id' })
  @Index()
  notificationId: string;

  @Column({ type: 'uniqueidentifier', name: 'recipient_id' })
  recipientId: string;

  @Column({ type: 'datetimeoffset', name: 'sent_at' })
  sentAt: Date;

  @Column({ type: 'nvarchar', length: 30, nullable: true })
  channel: ReminderChannel | null;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  result: ReminderResult | null;

  @Column({ type: 'nvarchar', length: 30, nullable: true, name: 'triggered_by' })
  triggeredBy: ReminderTrigger | null;

  @CreateDateColumn({ type: 'datetimeoffset', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => EventNotificationEntity)
  @JoinColumn({ name: 'notification_id' })
  notification: EventNotificationEntity;

  @ManyToOne(() => NotificationRecipientEntity, (r) => r.reminderLogs)
  @JoinColumn({ name: 'recipient_id' })
  recipient: NotificationRecipientEntity;
}
