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
import { UserEntity } from '../../users/entities/user.entity';
import { AnnouncementTargetEntity } from './announcement-target.entity';
import { AnnouncementAttachmentEntity } from './announcement-attachment.entity';
import { AnnouncementReadStatusEntity } from './announcement-read-status.entity';

export enum AnnouncementStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  EXPIRED = 'expired',
}

export enum AnnouncementPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('ann_notifications')
export class AnnouncementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 255 })
  title: string;

  @Column({ type: 'nvarchar', length: 'MAX' })
  content: string;

  @Column({
    type: 'nvarchar',
    length: 50,
    enum: AnnouncementStatus,
    default: AnnouncementStatus.DRAFT,
  })
  @Index()
  status: AnnouncementStatus;

  @Column({
    type: 'nvarchar',
    length: 20,
    enum: AnnouncementPriority,
    default: AnnouncementPriority.NORMAL,
  })
  priority: AnnouncementPriority;

  @Column({ type: 'datetime', nullable: true, name: 'send_at' })
  scheduledAt: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'sent_at' })
  sentAt: Date | null;

  @Column({ type: 'nvarchar', length: 100, name: 'created_by' })
  senderId: string;

  @Column({ type: 'bit', default: false, name: 'pin_top' })
  isPinned: boolean;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'category' })
  category: string | null;

  @Column({ type: 'bit', default: false, name: 'require_confirmation' })
  requireConfirmation: boolean;

  @Column({ type: 'bit', default: false, name: 'allow_comment' })
  allowComment: boolean;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  sender: UserEntity;

  @OneToMany(
    () => AnnouncementTargetEntity,
    (target: AnnouncementTargetEntity) => target.announcement,
    { cascade: true },
  )
  targets: AnnouncementTargetEntity[];

  @OneToMany(
    () => AnnouncementAttachmentEntity,
    (attachment: AnnouncementAttachmentEntity) => attachment.announcement,
    { cascade: true },
  )
  attachments: AnnouncementAttachmentEntity[];

  @OneToMany(
    () => AnnouncementReadStatusEntity,
    (status: AnnouncementReadStatusEntity) => status.announcement,
  )
  readStatuses: AnnouncementReadStatusEntity[];

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}