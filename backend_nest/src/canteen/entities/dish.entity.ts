import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { SupplierEntity } from './supplier.entity';

@Entity('dishes')
export class DishEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'nvarchar', unique: true, length: 50, nullable: true })
  dish_code: string;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  description: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  image_url: string;

  @Column({ type: 'nvarchar', length: 50, default: 'com' })
  category: string;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  ingredient_note: string;

  @Column({
    type: 'nvarchar',
    length: 'MAX',
    nullable: true,
    transformer: {
      to: (value: any) => JSON.stringify(value),
      from: (value: string) => {
        try { return JSON.parse(value); } catch { return null; }
      },
    },
  })
  tags_json: any;

  @Column({ name: 'unit_price', type: 'decimal', precision: 18, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  unit: string;

  @Column({ name: 'supplier_id', type: 'bigint', nullable: true })
  supplier_id: number;

  @ManyToOne(() => SupplierEntity)
  @JoinColumn({ name: 'supplier_id' })
  supplier: SupplierEntity;

  @Column({ type: 'tinyint', default: 1 })
  is_active: number;

  @Column({ type: 'tinyint', default: 0 })
  is_popular_cached: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  popular_count_cached: number;

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
