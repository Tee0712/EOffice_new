import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('meal_reconciliations')
@Index(['reconciliationMonth', 'departmentId'], { unique: true })
export class MealReconciliationEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ name: 'reconciliation_month', type: 'varchar', length: 7 })
  reconciliationMonth: string; // YYYY-MM format

  @Index()
  @Column({ name: 'department_id', type: 'nvarchar', length: 100, nullable: true })
  departmentId: string | null;

  @Column({ name: 'department_name', type: 'nvarchar', length: 500, nullable: true })
  departmentName: string | null;

  @Column({ name: 'total_registered', type: 'int', default: 0 })
  totalRegistered: number;

  @Column({ name: 'total_checked_in', type: 'int', default: 0 })
  totalCheckedIn: number;

  @Column({ name: 'total_cancelled', type: 'int', default: 0 })
  totalCancelled: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ name: 'final_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  finalAmount: number;

  @Column({ name: 'reconciliation_date', type: 'date', nullable: true })
  reconciliationDate: string | null;

  @Column({ name: 'reconciled_by', type: 'nvarchar', length: 100, nullable: true })
  reconciledBy: string | null;

  @Column({ name: 'reconciliation_status', type: 'varchar', length: 20, default: 'pending' })
  reconciliationStatus: string; // pending | approved | rejected

  @Column({ name: 'approved_by', type: 'nvarchar', length: 100, nullable: true })
  approvedBy: string | null;

  @Column({ name: 'approved_at', type: 'datetime2', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'notes', type: 'nvarchar', length: 'max', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
