import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { EventEntity } from './event.entity';

@Entity('event_programs')
export class EventProgramEntity {
  @PrimaryColumn({ type: 'uniqueidentifier' })
  id: string;

  @BeforeInsert()
  ensureIdentity() {
    if (!this.id) {
      this.id = randomUUID();
    }

    if (!this.createdAt) {
      this.createdAt = new Date();
    }
  }

  @Column({ type: 'uniqueidentifier', name: 'event_id' })
  @Index()
  eventId: string;

  @Column({ type: 'int', name: 'order_no' })
  orderNo: number;

  @Column({ type: 'nvarchar', length: 300 })
  title: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  description: string | null;

  @Column({ type: 'datetimeoffset', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'datetimeoffset', nullable: true, name: 'end_time' })
  endTime: Date | null;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  presenter: string | null;

  @Column({ type: 'datetimeoffset', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => EventEntity, (e) => e.programs)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;
}
