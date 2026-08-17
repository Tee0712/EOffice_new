import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductEntity } from './product.entity';

@Entity('Inventories')
export class InventoriesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  min_stock: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  max_stock: number;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
