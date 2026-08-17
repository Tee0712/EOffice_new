import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('university_partners')
export class UniversityPartnerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'nvarchar', length: 500, nullable: true })
  name: string;

  @Column({ name: 'short_name', type: 'nvarchar', length: 100, nullable: true })
  short_name: string;

  @Column({ name: 'code', type: 'nvarchar', length: 50, unique: true, nullable: true })
  code: string;

  @Column({ name: 'logo_path', type: 'nvarchar', length: 1000, nullable: true })
  logo_path: string;

  @Column({ name: 'address', type: 'nvarchar', length: 500, nullable: true })
  address: string;

  @Column({ name: 'website', type: 'nvarchar', length: 255, nullable: true })
  website: string;

  @Column({ name: 'primary_field', type: 'nvarchar', length: 255, nullable: true })
  primary_field: string;

  @Column({ name: 'cooperation_status', type: 'nvarchar', length: 50, nullable: true })
  cooperation_status: string;

  @Column({ name: 'mou_number', type: 'nvarchar', length: 100, nullable: true })
  mou_number: string;

  @Column({ name: 'expected_sign_date', type: 'date', nullable: true })
  expected_sign_date: Date;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effective_date: Date;

  @Column({ name: 'tcsg_signer_name', type: 'nvarchar', length: 200, nullable: true })
  tcsg_signer_name: string;

  @Column({ name: 'tcsg_signer_title', type: 'nvarchar', length: 200, nullable: true })
  tcsg_signer_title: string;

  @Column({ name: 'school_signer_name', type: 'nvarchar', length: 200, nullable: true })
  school_signer_name: string;

  @Column({ name: 'school_signer_title', type: 'nvarchar', length: 200, nullable: true })
  school_signer_title: string;

  @Column({ name: 'cooperation_goal', type: 'nvarchar', length: 'MAX', nullable: true })
  cooperation_goal: string;

  @Column({ name: 'min_gpa', type: 'decimal', precision: 4, scale: 2, nullable: true })
  min_gpa: number;

  @Column({ name: 'priority_target', type: 'nvarchar', length: 500, nullable: true })
  priority_target: string;

  @Column({ name: 'school_year', type: 'nvarchar', length: 50, nullable: true })
  school_year: string; // Added as per implementation plan

  @Column({ name: 'cooperation_contents', type: 'nvarchar', length: 'MAX', nullable: true })
  cooperation_contents: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  created_at: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  created_by: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updated_at: Date;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updated_by: number;
}
