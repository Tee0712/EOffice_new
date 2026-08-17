import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { NotificationRecipientEntity } from './notification-recipient.entity';

export enum ConfirmationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
}

@Entity('notification_confirmations')
export class NotificationConfirmationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'recipient_id', unique: true })
  @Index()
  recipientId: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'confirmed_by' })
  confirmedBy: string | null;

  @Column({ type: 'nvarchar', length: 20, default: ConfirmationStatus.PENDING })
  @Index()
  status: ConfirmationStatus;

  @Column({ type: 'datetimeoffset', nullable: true, name: 'confirmed_at' })
  confirmedAt: Date | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'decline_reason' })
  declineReason: string | null;

  @Column({ type: 'int', nullable: true, name: 'attendee_count' })
  attendeeCount: number | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'datetimeoffset', name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => NotificationRecipientEntity, (r) => r.confirmation)
  @JoinColumn({ name: 'recipient_id' })
  recipient: NotificationRecipientEntity;
}
