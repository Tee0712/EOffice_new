import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EventEntity } from './event.entity';

export enum AttachmentCategory {
  REGULATION = 'REGULATION',
  DOCUMENT = 'DOCUMENT',
  OTHER = 'OTHER',
}

@Entity('event_attachments')
export class EventAttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'event_id' })
  eventId: string;

  @Column({ type: 'nvarchar', length: 300, name: 'file_name' })
  fileName: string;

  @Column({ type: 'nvarchar', length: 'MAX', name: 'file_url' })
  fileUrl: string;

  @Column({ type: 'bigint', nullable: true, name: 'file_size' })
  fileSize: number | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'file_type' })
  fileType: string | null;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  category: AttachmentCategory | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'uploaded_by' })
  uploadedBy: string | null;

  @CreateDateColumn({ type: 'datetimeoffset', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => EventEntity, (e) => e.attachments)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;
}
