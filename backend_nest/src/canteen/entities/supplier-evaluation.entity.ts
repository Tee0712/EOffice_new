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
import { DishEntity } from './dish.entity';
import { SupplierOrderEntity } from './supplier-order.entity';
import { SupplierEvaluationScoreEntity } from './supplier-evaluation-score.entity';

@Entity('supplier_evaluations')
export class SupplierEvaluationEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint' })
  supplier_id: number;

  @ManyToOne(() => SupplierEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: SupplierEntity;

  @Column({ type: 'bigint', nullable: true })
  supplier_order_id: number | null;

  @ManyToOne(() => SupplierOrderEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplier_order_id' })
  order: SupplierOrderEntity | null;
  
  @Column({ type: 'bigint', nullable: true })
  dish_id: number | null;

  @ManyToOne(() => DishEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'dish_id' })
  dish: DishEntity | null;

  @Column({ type: 'nvarchar', length: 50, default: 'delivery' })
  period_type: 'delivery' | 'monthly' | 'quarterly';

  @Column({ type: 'date', nullable: true })
  period_start_date: string | null;

  @Column({ type: 'date', nullable: true })
  period_end_date: string | null;

  @Column({ type: 'nvarchar', length: 50, default: 'draft' })
  evaluation_status: 'draft' | 'submitted' | 'reviewed';

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  overall_score: number | null;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  overall_rating: string | null; // Xuất sắc, Tốt, Trung bình, Kém

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  comment: string | null;

  @OneToMany(() => SupplierEvaluationScoreEntity, (score) => score.evaluation)
  scores: SupplierEvaluationScoreEntity[];

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
