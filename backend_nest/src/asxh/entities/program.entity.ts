import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('programs')
export class ProgramEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'funding_type', type: 'nvarchar', length: 100 })
  funding_type: string;

  @Column({ name: 'code', type: 'nvarchar', length: 50, unique: true })
  code: string;

  @Column({ name: 'status', type: 'nvarchar', length: 50, nullable: true })
  status: string;

  @Column({ name: 'name', type: 'nvarchar', length: 500 })
  name: string;

  // Virtual columns (not in DB, populated in service)
  budget: number;
  disbursed_total: number;
  progress_percent: number;
  progress_note: string;

  @Column({ name: 'description', type: 'nvarchar', length: 'MAX', nullable: true })
  description: string;

  @Column({ name: 'locality', type: 'nvarchar', length: 255 })
  locality: string;

  @Column({ name: 'specific_address', type: 'nvarchar', length: 500, nullable: true })
  specific_address: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  start_date: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  end_date: Date;

  @Column({ name: 'local_partner', type: 'nvarchar', length: 500, nullable: true })
  local_partner: string;

  @Column({ name: 'beneficiary', type: 'nvarchar', length: 500, nullable: true })
  beneficiary: string;

  @Column({ name: 'classification_keywords', type: 'nvarchar', length: 500, nullable: true })
  classification_keywords: string;

  @Column({ name: 'funding_source', type: 'nvarchar', length: 500, nullable: true })
  funding_source: string;

  /*
    @Column({ name: 'lead_department', type: 'nvarchar', length: 255, nullable: true })
    lead_department: string;
  */

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updated_at: Date;
}
