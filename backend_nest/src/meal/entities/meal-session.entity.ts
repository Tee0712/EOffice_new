import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DailyMenuEntity } from './daily-menu.entity';
import { RegistrationItemEntity } from './registration-item.entity';
import { MealTemplateSessionEntity } from './meal-template-session.entity';

@Entity('meal_sessions')
export class MealSessionEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'nvarchar', length: 50 })
  name: string; // Ăn sáng | Ăn trưa | Ăn tối

  @Column({ name: 'time_start', type: 'varchar', length: 10 })
  timeStart: string; // HH:mm

  @Column({ name: 'time_end', type: 'varchar', length: 10 })
  timeEnd: string; // HH:mm

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  icon: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => DailyMenuEntity, (m) => m.mealSession)
  dailyMenus: DailyMenuEntity[];

  @OneToMany(() => RegistrationItemEntity, (r) => r.mealSession)
  registrationItems: RegistrationItemEntity[];
}
