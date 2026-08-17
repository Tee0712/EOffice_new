import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { EventNotificationEntity } from './event-notification.entity';
import { NotificationConfirmationEntity } from './notification-confirmation.entity';
import { ReminderLogEntity } from './reminder-log.entity';
import { GuestRegistrationEntity } from './guest-registration.entity';

@Entity('notification_recipients')
@Unique(['notificationId', 'departmentId'])
export class NotificationRecipientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'notification_id' })
  @Index()
  notificationId: string;

  @Column({ type: 'nvarchar', length: 100, name: 'department_id' })
  @Index()
  departmentId: string;

  @Column({ type: 'int', default: 0, name: 'max_guests' })
  maxGuests: number;

  @Column({ type: 'bit', default: 1, name: 'is_related_function' })
  isRelatedFunction: boolean;

  @CreateDateColumn({ type: 'datetimeoffset', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => EventNotificationEntity, (n) => n.recipients)
  @JoinColumn({ name: 'notification_id' })
  notification: EventNotificationEntity;

  @OneToOne(() => NotificationConfirmationEntity, (c) => c.recipient, { cascade: true, nullable: true })
  confirmation: NotificationConfirmationEntity | null;

  @OneToMany(() => ReminderLogEntity, (r) => r.recipient)
  reminderLogs: ReminderLogEntity[];

  @OneToMany(() => GuestRegistrationEntity, (g) => g.recipient)
  guestRegistrations: GuestRegistrationEntity[];
}
