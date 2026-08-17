import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { MealSessionEntity } from './meal-session.entity';
import { RegistrationItemEntity } from './registration-item.entity';

@Entity('daily_menus')
@Index(['date', 'mealSessionId'], { unique: true })
export class DailyMenuEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Index()
  @Column({ name: 'meal_session_id', type: 'int' })
  mealSessionId: number;

  @Column({ name: 'is_active', type: 'bit', default: true })
  isActive: boolean;

  @Column({ name: 'dish_name', type: 'nvarchar', length: 500 })
  dishName: string;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  price: number;

  @Column({ name: 'serving_time', type: 'varchar', length: 20, nullable: true })
  servingTime: string | null;

  @Column({ name: 'photo_url', type: 'nvarchar', length: 500, nullable: true })
  photoUrl: string | null;

  @Column({ name: 'created_by', type: 'nvarchar', length: 100, nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => MealSessionEntity, (s) => s.dailyMenus)
  @JoinColumn({ name: 'meal_session_id' })
  mealSession: MealSessionEntity;

  @OneToMany(() => RegistrationItemEntity, (r) => r.dailyMenu)
  registrationItems: RegistrationItemEntity[];
}
