import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AnnouncementEntity } from './announcement.entity';

export enum TargetType {
  ALL = 'all',
  DEPARTMENT = 'department',
  ROLE = 'role',
  USER = 'user',
}

@Entity('ann_recipients')
export class AnnouncementTargetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'notification_id' })
  announcementId: string;

  @Column({
    type: 'nvarchar',
    length: 50,
    enum: TargetType,
    name: 'target_type',
    default: TargetType.ALL,
  })
  targetType: TargetType;

  @Column({ type: 'nvarchar', length: 100, name: 'target_id', nullable: true })
  targetId: string | null;

  @ManyToOne(() => AnnouncementEntity, (announcement) => announcement.targets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  announcement: AnnouncementEntity;
}
