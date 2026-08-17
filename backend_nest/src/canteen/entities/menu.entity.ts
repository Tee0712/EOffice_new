import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { SupplierEntity } from './supplier.entity';
import { MenuItemEntity } from './menu-item.entity';

@Entity('menus')
@Index(['menu_date', 'meal_slot'], { unique: true })
export class MenuEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'date' })
  menu_date: string;

  @Column({ type: 'nvarchar', length: 50 })
  meal_slot: string;

  @ManyToOne(() => SupplierEntity, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: SupplierEntity;

  @Column({ type: 'nvarchar', length: 50, default: 'draft' })
  status: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price_total_planned: number;

  @Column({ type: 'datetime', nullable: true })
  published_at: Date;

  @Column({ type: 'datetime', nullable: true })
  publish_deadline_at: Date;

  @Column({ type: 'datetime' })
  register_deadline_at: Date;

  @Column({ type: 'datetime' })
  cancel_deadline_at: Date;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  note: string | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  serving_time: string | null;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  image_url_manual: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  description_manual: string | null;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  title_manual: string | null;

  @OneToMany(() => MenuItemEntity, (item: MenuItemEntity) => item.menu)
  items: MenuItemEntity[];

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
