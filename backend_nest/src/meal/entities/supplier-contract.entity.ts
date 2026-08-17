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

@Entity('supplier_contracts')
@Unique(['supplier_id', 'contract_no'])
export class SupplierContractEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  supplier_id: number;

  @ManyToOne(() => SupplierEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: SupplierEntity;

  @Column({ type: 'nvarchar', length: 50 })
  contract_no: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  contract_type: string | null;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  value_amount: number;

  @Column({ type: 'nvarchar', length: 50, default: 'draft' })
  status: 'active' | 'expired' | 'terminated' | 'draft';

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  file_url: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  notes: string | null;

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
