import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { EventEntity } from './event.entity';
import { NotificationRecipientEntity } from './notification-recipient.entity';

export enum NotificationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  RECALLED = 'RECALLED',
}

export enum SendType {
  SYSTEM = 'SYSTEM',
  EMAIL = 'EMAIL',
  PDF_EXPORT = 'PDF_EXPORT',
}

@Entity('event_notifications')
export class EventNotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'event_id' })
  @Index()
  eventId: string;

  @Column({ type: 'nvarchar', length: 500 })
  title: string;

  @Column({ type: 'nvarchar', length: 'MAX' })
  content: string;

  @Column({ type: 'nvarchar', length: 30, name: 'send_type' })
  sendType: SendType;

  @Column({ type: 'datetimeoffset', nullable: true, name: 'sent_at' })
  sentAt: Date | null;

  @Column({ type: 'nvarchar', length: 20, default: NotificationStatus.DRAFT })
  @Index()
  status: NotificationStatus;

  @Column({ type: 'bit', default: 0, name: 'reminder_enabled' })
  reminderEnabled: boolean;

  @Column({ type: 'int', nullable: true, name: 'reminder_days_before' })
  reminderDaysBefore: number | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'created_by' })
  createdBy: string | null;

  @CreateDateColumn({ type: 'datetimeoffset', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetimeoffset', nullable: true, name: 'updated_at' })
  updatedAt: Date | null;

  @ManyToOne(() => EventEntity, (e) => e.notifications)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @OneToMany(() => NotificationRecipientEntity, (r) => r.notification, { cascade: true })
  recipients: NotificationRecipientEntity[];
}
