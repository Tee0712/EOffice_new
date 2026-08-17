import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { AnnouncementEntity } from './announcement.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('ann_reads')
export class AnnouncementReadStatusEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'notification_id' })
  @Index()
  announcementId: string;

  @Column({ type: 'nvarchar', length: 100, name: 'user_id' })
  @Index()
  userId: string;

  @Column({ type: 'datetime', nullable: true, name: 'read_at' })
  @Index()
  readAt: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'confirmed_at' })
  confirmedAt: Date | null;

  @CreateDateColumn({ type: 'datetime', name: 'received_at' })
  receivedAt: Date;

  @ManyToOne(() => AnnouncementEntity, (announcement) => announcement.readStatuses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  announcement: AnnouncementEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
