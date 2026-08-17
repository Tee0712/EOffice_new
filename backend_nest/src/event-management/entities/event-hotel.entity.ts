import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EventLogisticsEntity } from './event-logistics.entity';
import { EventGuestEntity } from './event-guest.entity';

@Entity('event_hotels')
export class EventHotelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'logistics_id' })
  logisticsId: string;

  @Column({ type: 'uniqueidentifier', nullable: true, name: 'guest_id' })
  guestId: string | null;

  @Column({ type: 'nvarchar', length: 500, name: 'hotel_name' })
  hotelName: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'room_type' })
  roomType: string | null;

  @Column({ type: 'date', nullable: true, name: 'checkin_date' })
  checkinDate: Date | null;

  @Column({ type: 'date', nullable: true, name: 'checkout_date' })
  checkoutDate: Date | null;

  @Column({ type: 'int', default: 1, name: 'room_count' })
  roomCount: number;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'booking_ref' })
  bookingRef: string | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'datetimeoffset', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => EventLogisticsEntity, (l) => l.hotels)
  @JoinColumn({ name: 'logistics_id' })
  logistics: EventLogisticsEntity;

  @ManyToOne(() => EventGuestEntity, { nullable: true })
  @JoinColumn({ name: 'guest_id' })
  guest: EventGuestEntity | null;
}
