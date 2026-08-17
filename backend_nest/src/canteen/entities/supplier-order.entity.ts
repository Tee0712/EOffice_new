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
  Unique,
} from 'typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { SupplierEntity } from './supplier.entity';
import { MenuEntity } from './menu.entity';

@Entity('supplier_orders')
@Unique(['order_no'])
export class SupplierOrderEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  supplier_id: number;

  @ManyToOne(() => SupplierEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: SupplierEntity;

  @Column({ type: 'nvarchar', length: 30 })
  order_no: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  menu_id: number | null;

  @ManyToOne(() => MenuEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'menu_id' })
  menu: MenuEntity | null;

  @Column({ type: 'date' })
  order_date: string;

  @Column({ type: 'nvarchar', length: 50 })
  meal_slot: 'breakfast' | 'lunch' | 'dinner';

  @Column({ type: 'int', unsigned: true, default: 0 })
  expected_qty: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  delivered_qty: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price: number;

  @Column({ type: 'nvarchar', length: 50, default: 'draft' })
  status: 'draft' | 'confirmed' | 'delivered' | 'cancelled';

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
