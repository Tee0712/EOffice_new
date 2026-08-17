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
} from 'typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { SupplierContractEntity } from './supplier-contract.entity';
import { SupplierOrderEntity } from './supplier-order.entity';
import { SupplierEvaluationEntity } from './supplier-evaluation.entity';

@Entity('suppliers')
export class SupplierEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'nvarchar', unique: true, length: 20 })
  supplier_code: string;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'nvarchar', length: 50, default: 'cong_nghiep' })
  type: string;

  @Column({ type: 'nvarchar', unique: true, length: 20, nullable: true })
  tax_code: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  representative_name: string;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'nvarchar', length: 150, nullable: true })
  email: string;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  address: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  logo_url: string;

  @Column({ type: 'tinyint', default: 1 })
  is_active: number;

  @Column({ type: 'nvarchar', length: 50, default: 'pending' })
  contract_status_cached: string;

  @Column({ type: 'date', nullable: true })
  contract_end_at_cached: Date;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating_avg_cached: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  rating_count_cached: number;

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

  @OneToMany(() => SupplierContractEntity, (contract) => contract.supplier)
  contracts: SupplierContractEntity[];

  @OneToMany(() => SupplierOrderEntity, (order) => order.supplier)
  orders: SupplierOrderEntity[];

  @OneToMany(() => SupplierEvaluationEntity, (evaluation) => evaluation.supplier)
  evaluations: SupplierEvaluationEntity[];
}
