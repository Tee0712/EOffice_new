import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { MealTemplateSessionEntity } from './meal-template-session.entity';

@Entity('meal_templates')
export class MealTemplateEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'user_id', type: 'nvarchar', length: 100, nullable: true })
  userId: string | null; // NULL = system template

  @Column({ type: 'nvarchar', length: 200 })
  name: string;

  @Column({ name: 'meal_sessions', type: 'nvarchar', length: 'max' })
  mealSessions: string; // JSON array of meal_session_id

  @Column({ name: 'is_system', type: 'bit', default: false })
  isSystem: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
