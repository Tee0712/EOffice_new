import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from 'src/users/entities/user.entity';

@Entity('leave_business_records')
@Index(['user_id', 'type', 'date_from', 'date_to'])
export class LeaveBusinessRecordEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  user_id: string | null; // NULL = holiday (all users)

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity | null;

  @Column({ type: 'nvarchar', length: 50 })
  type: string; // 'business_trip', 'leave', 'holiday'

  @Column({ type: 'date' })
  date_from: string;

  @Column({ type: 'date' })
  date_to: string;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  reason: string | null;

  @Column({ type: 'nvarchar', length: 50, default: 'manual' })
  source: string; // 'manual', 'hr_sync'

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  external_id: string | null;

  @Column({ type: 'tinyint', default: 0 })
  is_approved: number;

  @Column({ type: 'datetime', nullable: true })
  approved_at: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at: Date;
}
