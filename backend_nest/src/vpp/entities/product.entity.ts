import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('Product')
export class ProductEntity {
  @PrimaryColumn()
  id: number;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 50 })
  unit: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  reference_price: number;

  @Column({ length: 20, default: 'active' })
  status: string; // active, inactive, hidden

  @Column({ length: 500, nullable: true })
  note: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  image_url: string | null;

  @Column({ length: 50, nullable: true })
  quotaValue: string;

  @Column({ length: 50, nullable: true })
  quotaUnit: string;


  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
