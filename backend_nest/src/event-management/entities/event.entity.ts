import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { EventProgramEntity } from './event-program.entity';
import { EventAttachmentEntity } from './event-attachment.entity';
import { EventNotificationEntity } from './event-notification.entity';
import { EventLogisticsEntity } from './event-logistics.entity';

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('events')
export class EventEntity {
  @PrimaryColumn({ type: 'uniqueidentifier' })
  id: string;

  @BeforeInsert()
  ensureId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @BeforeInsert()
  setTimestampsOnInsert() {
    const now = new Date();
    if (!this.createdAt) {
      this.createdAt = now;
    }
    if (!this.updatedAt) {
      this.updatedAt = now;
    }
  }

  @BeforeUpdate()
  setUpdatedAtOnUpdate() {
    this.updatedAt = new Date();
  }

  @Column({ type: 'nvarchar', length: 20, unique: true })
  @Index()
  code: string;

  @Column({ type: 'nvarchar', length: 500 })
  name: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  description: string | null;

  @Column({ type: 'datetimeoffset', name: 'start_datetime' })
  @Index()
  startDatetime: Date;

  @Column({ type: 'datetimeoffset', name: 'end_datetime' })
  endDatetime: Date;

  @Column({ type: 'nvarchar', length: 500 })
  location: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'location_detail' })
  locationDetail: string | null;

  @Column({ type: 'nvarchar', length: 30, default: EventStatus.DRAFT })
  @Index()
  status: EventStatus;

  @Column({ type: 'int', nullable: true, name: 'max_total_guests' })
  maxTotalGuests: number | null;

  @Column({ type: 'datetimeoffset', nullable: true, name: 'confirmation_deadline' })
  confirmationDeadline: Date | null;

  @Column({ type: 'datetimeoffset', nullable: true, name: 'guest_reg_deadline' })
  guestRegDeadline: Date | null;

  @Column({ type: 'bit', default: 1, name: 'allow_guest_reg' })
  allowGuestReg: boolean;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'created_by' })
  createdBy: string | null;

  @CreateDateColumn({ type: 'datetimeoffset', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetimeoffset', nullable: true, name: 'updated_at' })
  updatedAt: Date | null;

  @Column({ type: 'datetimeoffset', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;

  @OneToMany(() => EventProgramEntity, (p) => p.event, { cascade: true })
  programs: EventProgramEntity[];

  @OneToMany(() => EventAttachmentEntity, (a) => a.event, { cascade: true })
  attachments: EventAttachmentEntity[];

  @OneToMany(() => EventNotificationEntity, (n) => n.event)
  notifications: EventNotificationEntity[];

  @OneToMany(() => EventLogisticsEntity, (l) => l.event)
  logistics: EventLogisticsEntity[];
}
