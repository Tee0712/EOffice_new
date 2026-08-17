import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { EventEntity } from './event.entity';
import { EventGuestEntity } from './event-guest.entity';
import { NotificationRecipientEntity } from './notification-recipient.entity';
import { GuestType } from './event-guest.entity';

export enum RegistrationStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}

@Entity('guest_registrations')
@Unique(['eventId', 'guestId'])
export class GuestRegistrationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'event_id' })
  @Index()
  eventId: string;

  @Column({ type: 'uniqueidentifier', name: 'guest_id' })
  @Index()
  guestId: string;

  @Column({ type: 'nvarchar', length: 100, name: 'department_id' })
  @Index()
  departmentId: string;

  @Column({ type: 'uniqueidentifier', nullable: true, name: 'recipient_id' })
  recipientId: string | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'registered_by' })
  registeredBy: string | null;

  @Column({ type: 'nvarchar', length: 30, nullable: true, name: 'guest_type' })
  guestType: GuestType | null;

  @Column({ type: 'nvarchar', length: 20, default: RegistrationStatus.ACTIVE })
  @Index()
  status: RegistrationStatus;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'datetimeoffset', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @ManyToOne(() => EventGuestEntity, (g) => g.registrations)
  @JoinColumn({ name: 'guest_id' })
  guest: EventGuestEntity;

  @ManyToOne(() => NotificationRecipientEntity, (r) => r.guestRegistrations)
  @JoinColumn({ name: 'recipient_id' })
  recipient: NotificationRecipientEntity | null;
}
