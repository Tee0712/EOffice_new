import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EventLogisticsEntity } from './event-logistics.entity';

@Entity('event_transports')
export class EventTransportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'logistics_id' })
  logisticsId: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'vehicle_type' })
  vehicleType: string | null;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'pickup_location' })
  pickupLocation: string | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'dropoff_location' })
  dropoffLocation: string | null;

  @Column({ type: 'datetimeoffset', nullable: true, name: 'pickup_time' })
  pickupTime: Date | null;

  @Column({ type: 'nvarchar', length: 500, nullable: true, name: 'driver_info' })
  driverInfo: string | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'datetimeoffset', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => EventLogisticsEntity, (l) => l.transports)
  @JoinColumn({ name: 'logistics_id' })
  logistics: EventLogisticsEntity;
}
