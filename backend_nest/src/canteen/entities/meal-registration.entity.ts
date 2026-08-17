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
import { MenuEntity } from './menu.entity';
import { MenuItemEntity } from './menu-item.entity';
import { LeaveBusinessRecordEntity } from './leave-business-record.entity';

@Entity('meal_registrations')
@Index(['user_id', 'menu_id'], { unique: true })
export class MealRegistrationEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'nvarchar', length: 100 })
  user_id: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'bigint', unsigned: true })
  menu_id: number;

  @ManyToOne(() => MenuEntity)
  @JoinColumn({ name: 'menu_id' })
  menu: MenuEntity;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  menu_item_id: number | null;

  @ManyToOne(() => MenuItemEntity, { nullable: true })
  @JoinColumn({ name: 'menu_item_id' })
  menu_item: MenuItemEntity | null;

  @Column({ type: 'nvarchar', length: 50, default: 'registered' })
  status: string; // 'registered', 'cancelled', 'auto_cut'

  @Column({ type: 'datetime', nullable: true })
  registered_at: Date;

  @Column({ type: 'datetime', nullable: true })
  cancelled_at: Date | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  cancel_reason: string | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  cancelled_by_admin_id: string | null;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  auto_cut_reason: string | null; // 'business_trip', 'leave', 'holiday'

  @Column({ type: 'datetime', nullable: true })
  auto_cut_at: Date | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  auto_cut_source_record_id: number | null;

  @ManyToOne(() => LeaveBusinessRecordEntity, { nullable: true })
  @JoinColumn({ name: 'auto_cut_source_record_id' })
  auto_cut_source: LeaveBusinessRecordEntity | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at: Date;
}
