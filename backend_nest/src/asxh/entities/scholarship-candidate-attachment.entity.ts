import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('scholarship_candidate_attachments')
export class ScholarshipCandidateAttachmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'scholarship_candidate_id', type: 'int' })
  scholarship_candidate_id: number;

  @Column({ name: 'title', type: 'nvarchar', length: 500 })
  title: string;

  @Column({ name: 'path', type: 'nvarchar', length: 1000 })
  path: string;

  @Column({ name: 'doc_type', type: 'nvarchar', length: 100, nullable: true })
  doc_type: string;

  @Column({ name: 'is_required', type: 'bit', default: 0 })
  is_required: boolean;

  @Column({ name: 'status', type: 'nvarchar', length: 50, nullable: true })
  status: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'datetime2' })
  uploaded_at: Date;

  @Column({ name: 'uploaded_by', type: 'int', nullable: true })
  uploaded_by: number;
}
