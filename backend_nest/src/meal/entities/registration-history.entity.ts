import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { MealBookingEntity } from './meal-booking.entity';

@Entity('registration_history')
export class RegistrationHistoryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ name: 'registration_id', type: 'bigint' })
  registrationId: number;

  @Column({ type: 'varchar', length: 20 })
  action: string; // created | updated | cancelled

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  description: string | null;

  @Column({ name: 'changed_by', type: 'nvarchar', length: 100 })
  changedBy: string;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;

  @ManyToOne(() => MealBookingEntity, (r) => r.history)
  @JoinColumn({ name: 'registration_id' })
  registration: MealBookingEntity;
}
