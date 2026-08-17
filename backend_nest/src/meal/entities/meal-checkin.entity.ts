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
import { MealRegistrationEntity } from './meal-registration.entity';

@Entity('meal_checkins')
@Index(['user_id', 'menu_id'], { unique: true })
export class MealCheckinEntity {
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

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  registration_id: number | null;

  @ManyToOne(() => MealRegistrationEntity, { nullable: true })
  @JoinColumn({ name: 'registration_id' })
  registration: MealRegistrationEntity | null;

  @Column({ type: 'datetime' })
  checked_in_at: Date;

  @Column({ type: 'nvarchar', length: 20, default: 'manual' })
  method: 'qr' | 'card' | 'manual';

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  checked_in_by: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'checked_in_by' })
  admin: UserEntity | null;

  @Column({ type: 'tinyint', default: 1 })
  is_valid: number;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  // @ManyToOne(() => UserEntity, { nullable: true })
  // @JoinColumn({ name: 'created_by' })
  // created_by: UserEntity;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  // @ManyToOne(() => UserEntity, { nullable: true })
  // @JoinColumn({ name: 'updated_by' })
  // updated_by: UserEntity;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at: Date;
}

export { MealCheckinEntity as MealCheckInEntity };
