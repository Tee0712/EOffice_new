import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('scholarship_candidate_semester_results')
export class ScholarshipCandidateResultEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'scholarship_candidate_id', type: 'int' })
  scholarship_candidate_id: number;

  @Column({ name: 'semester_name', type: 'nvarchar', length: 100, nullable: true })
  semester_name: string;

  @Column({ name: 'semester_gpa', type: 'decimal', precision: 4, scale: 2, nullable: true })
  semester_gpa: number;

  @Column({ name: 'credits', type: 'int', nullable: true })
  credits: number;

  @Column({ name: 'classification', type: 'nvarchar', length: 100, nullable: true })
  classification: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  created_at: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  created_by: number;
}
