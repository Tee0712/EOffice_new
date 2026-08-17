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
import { SupplierEvaluationEntity } from './supplier-evaluation.entity';

@Entity('supplier_evaluation_scores')
@Unique(['evaluation_id', 'criterion_code'])
export class SupplierEvaluationScoreEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  evaluation_id: number;

  @ManyToOne(() => SupplierEvaluationEntity, (evalu) => evalu.scores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluation_id' })
  evaluation: SupplierEvaluationEntity;

  @Column({ type: 'nvarchar', length: 30 })
  criterion_code: string; // quality, on_time, hygiene, attitude, price_competitive

  @Column({ type: 'tinyint', unsigned: true })
  score: number; // 1-5

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  comment: string | null;

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
