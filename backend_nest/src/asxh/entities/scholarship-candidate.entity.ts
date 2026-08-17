import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('scholarship_candidates')
export class ScholarshipCandidateEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'code', type: 'nvarchar', length: 100, unique: true })
  code: string;

  @Column({ name: 'university_partner_id', type: 'int', nullable: true })
  university_partner_id: number;

  @Column({ name: 'full_name', type: 'nvarchar', length: 200, nullable: true })
  full_name: string;

  @Column({ name: 'dob', type: 'date', nullable: true })
  dob: Date;

  @Column({ name: 'gender', type: 'nvarchar', length: 10, nullable: true })
  gender: string;

  @Column({ name: 'national_id', type: 'nvarchar', length: 50, nullable: true })
  national_id: string;

  @Column({ name: 'phone', type: 'nvarchar', length: 50, nullable: true })
  phone: string;

  @Column({ name: 'email', type: 'nvarchar', length: 255, nullable: true })
  email: string;

  @Column({ name: 'avatar_path', type: 'nvarchar', length: 1000, nullable: true })
  avatar_path: string;

  @Column({ name: 'permanent_address', type: 'nvarchar', length: 500, nullable: true })
  permanent_address: string;

  @Column({ name: 'ethnicity', type: 'nvarchar', length: 100, nullable: true })
  ethnicity: string;

  @Column({ name: 'hometown', type: 'nvarchar', length: 255, nullable: true })
  hometown: string;

  @Column({ name: 'university_name', type: 'nvarchar', length: 500, nullable: true })
  university_name: string;

  @Column({ name: 'major_name', type: 'nvarchar', length: 300, nullable: true })
  major_name: string;

  @Column({ name: 'student_code', type: 'nvarchar', length: 100, nullable: true })
  student_code: string;

  @Column({ name: 'course_code', type: 'nvarchar', length: 100, nullable: true })
  course_code: string;

  @Column({ name: 'study_year', type: 'nvarchar', length: 50, nullable: true })
  study_year: string;

  @Column({ name: 'education_type', type: 'nvarchar', length: 100, nullable: true })
  education_type: string;

  @Column({ name: 'gpa_current', type: 'decimal', precision: 4, scale: 2, nullable: true })
  gpa_current: number;

  @Column({ name: 'gpa_scale', type: 'decimal', precision: 4, scale: 2, nullable: true })
  gpa_scale: number;

  @Column({ name: 'priority_group', type: 'nvarchar', length: 100, nullable: true })
  priority_group: string;

  @Column({ name: 'family_context', type: 'nvarchar', length: 'MAX', nullable: true })
  family_context: string;

  @Column({ name: 'income_per_person_per_month', type: 'decimal', precision: 18, scale: 2, nullable: true })
  income_per_person_per_month: number;

  @Column({ name: 'siblings_in_school_count', type: 'int', nullable: true })
  siblings_in_school_count: number;

  @Column({ name: 'motivation_letter', type: 'nvarchar', length: 'MAX', nullable: true })
  motivation_letter: string;

  @Column({ name: 'extracurricular', type: 'nvarchar', length: 'MAX', nullable: true })
  extracurricular: string;

  @Column({ name: 'skills_certificates', type: 'nvarchar', length: 'MAX', nullable: true })
  skills_certificates: string;

  @Column({ name: 'status', type: 'nvarchar', length: 50, nullable: true })
  status: string;

  @Column({ name: 'school_year', type: 'nvarchar', length: 50, nullable: true })
  school_year: string; // Added as per implementation plan

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  created_at: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  created_by: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updated_at: Date;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updated_by: number;
}
