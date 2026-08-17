import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MealBookingEntity } from './meal-booking.entity';
import { MealSessionEntity } from './meal-session.entity';
import { DailyMenuEntity } from './daily-menu.entity';

@Entity('registration_items')
@Index(['registrationId', 'mealSessionId'], { unique: true })
export class RegistrationItemEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ name: 'registration_id', type: 'bigint' })
  registrationId: number;

  @Column({ name: 'meal_session_id', type: 'int' })
  mealSessionId: number;

  @Column({ name: 'daily_menu_id', type: 'bigint' })
  dailyMenuId: number;

  @Column({ name: 'price_at_time', type: 'decimal', precision: 12, scale: 0 })
  priceAtTime: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => MealBookingEntity, (r) => r.items)
  @JoinColumn({ name: 'registration_id' })
  registration: MealBookingEntity;

  @ManyToOne(() => MealSessionEntity, (s) => s.registrationItems)
  @JoinColumn({ name: 'meal_session_id' })
  mealSession: MealSessionEntity;

  @ManyToOne(() => DailyMenuEntity, (m) => m.registrationItems)
  @JoinColumn({ name: 'daily_menu_id' })
  dailyMenu: DailyMenuEntity;
}
