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
import { DishEntity } from './dish.entity';
import { SupplierEntity } from './supplier.entity';

@Entity('menu_items')
@Index(['menu_id', 'dish_id'], { unique: true })
export class MenuItemEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  menu_id: number;

  @ManyToOne(() => MenuEntity, (menu) => menu.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu: MenuEntity;

  @Column({ type: 'bigint', unsigned: true })
  dish_id: number;

  @ManyToOne(() => DishEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'dish_id' })
  dish: DishEntity;

  @ManyToOne(() => SupplierEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: SupplierEntity;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unit_price_snapshot: number;

  @Column({ type: 'nvarchar', length: 20, default: 'suất' })
  unit: string;

  @Column({ type: 'time', nullable: true })
  service_start_time: string;

  @Column({ type: 'time', nullable: true })
  service_end_time: string;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  note: string;

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
