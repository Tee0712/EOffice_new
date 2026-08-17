import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { EventEntity } from './event.entity';
import { EventHotelEntity } from './event-hotel.entity';
import { EventTransportEntity } from './event-transport.entity';
import { EventCateringEntity } from './event-catering.entity';

export enum LogisticsType {
  HOTEL = 'HOTEL',
  TRANSPORT = 'TRANSPORT',
  CATERING = 'CATERING',
  OTHER = 'OTHER',
}

export enum LogisticsStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('event_logistics')
export class EventLogisticsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'event_id' })
  @Index()
  eventId: string;

  @Column({ type: 'nvarchar', length: 30, name: 'logistics_type' })
  @Index()
  logisticsType: LogisticsType;

  @Column({ type: 'nvarchar', length: 20, default: LogisticsStatus.PENDING })
  status: LogisticsStatus;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'request_note' })
  requestNote: string | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'assigned_to' })
  assignedTo: string | null;

  @Column({ type: 'datetimeoffset', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @CreateDateColumn({ type: 'datetimeoffset', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => EventEntity, (e) => e.logistics)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @OneToMany(() => EventHotelEntity, (h) => h.logistics, { cascade: true })
  hotels: EventHotelEntity[];

  @OneToMany(() => EventTransportEntity, (t) => t.logistics, { cascade: true })
  transports: EventTransportEntity[];

  @OneToMany(() => EventCateringEntity, (c) => c.logistics, { cascade: true })
  caterings: EventCateringEntity[];
}
