import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AnnouncementEntity } from './announcement.entity';

export enum AttachmentType {
  FILE = 'FILE',
  LINK = 'LINK',
}

@Entity('ann_attachments')
export class AnnouncementAttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'notification_id' })
  announcementId: string;

  @Column({ type: 'nvarchar', length: 500, name: 'file_url' })
  fileUrl: string;

  @Column({ type: 'nvarchar', length: 255, name: 'file_name' })
  fileName: string;

  @Column({
    type: 'nvarchar',
    length: 100,
    name: 'file_type',
    nullable: true,
  })
  type: string | null;

  @ManyToOne(() => AnnouncementEntity, (announcement) => announcement.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  announcement: AnnouncementEntity;
}
