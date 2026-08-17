import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('program_attachments')
export class ProgramAttachmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'program_id', type: 'int' })
  programId: number;

  @Column({ name: 'document_id', type: 'int', nullable: true })
  documentId?: number;

  @Column({ name: 'document_code', type: 'nvarchar', length: 100, nullable: true })
  documentCode?: string;

  @Column({ name: 'document_subject', type: 'nvarchar', length: 1000, nullable: true })
  documentSubject?: string;

  @Column({ name: 'title', type: 'nvarchar', length: 500, nullable: true })
  title?: string;

  @Column({ name: 'path', type: 'nvarchar', length: 1000, nullable: true })
  path?: string;

  @Column({ name: 'doc_type', type: 'nvarchar', length: 100, nullable: true })
  docType?: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt: Date;

  @Column({ name: 'uploaded_by', type: 'int', nullable: true })
  uploadedBy?: number;
}
