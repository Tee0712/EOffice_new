import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RegistrationItemEntity } from './registration-item.entity';
import { RegistrationHistoryEntity } from './registration-history.entity';

@Entity('meal_bookings')
@Index(['userId', 'date'], { unique: true })
export class MealBookingEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ name: 'user_id', type: 'nvarchar', length: 100 })
  userId: string;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({
    type: 'varchar',
    length: 20,
    default: 'upcoming',
  })
  status: string; // upcoming | active | completed | cancelled

  @Column({ name: 'total_cost', type: 'decimal', precision: 12, scale: 0, default: 0 })
  totalCost: number;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  note: string | null;

  @Column({ name: 'registered_at', type: 'datetime2', nullable: true })
  registeredAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'datetime2', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancel_reason', type: 'nvarchar', length: 'max', nullable: true })
  cancelReason: string | null;

  @Column({ name: 'is_refunded', type: 'bit', default: false })
  isRefunded: boolean;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 12, scale: 0, default: 0 })
  refundAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => RegistrationItemEntity, (item) => item.registration, { cascade: true })
  items: RegistrationItemEntity[];

  @OneToMany(() => RegistrationHistoryEntity, (h) => h.registration, { cascade: true })
  history: RegistrationHistoryEntity[];
}
