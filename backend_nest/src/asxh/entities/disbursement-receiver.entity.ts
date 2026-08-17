import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('disbursement_receivers')
export class DisbursementReceiverEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'nvarchar', length: 500 })
  name: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  tax_code: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  bank_name: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  bank_account_number: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  bank_branch: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  bank_account_holder: string;

  @Column({ type: 'bit', default: 1 })
  is_active: boolean;

  @CreateDateColumn({ type: 'datetime2', precision: 0 })
  created_at: Date;

  @Column({ type: 'int', nullable: true })
  created_by: number;

  @UpdateDateColumn({ type: 'datetime2', precision: 0 })
  updated_at: Date;

  @Column({ type: 'int', nullable: true })
  updated_by: number;
}
