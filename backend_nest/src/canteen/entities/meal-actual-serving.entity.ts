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
// import { SupplierOrderEntity } from './supplier-order.entity'; // Will create next

@Entity('meal_actual_servings')
export class MealActualServingEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

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
  supplier_order_id: number | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  actual_qty: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  actual_amount: number | null;

  @Column({ type: 'nvarchar', length: 20, default: 'manual' })
  source: 'kitchen' | 'supplier' | 'manual';

  @Column({ type: 'datetime' })
  recorded_at: Date;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  recorded_by: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'recorded_by' })
  recorder: UserEntity | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by: UserEntity;
}
