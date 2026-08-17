import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('program_documents')
export class ProgramDocumentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'program_id', type: 'int' })
  programId: number;

  @Column({ name: 'document_id', type: 'bigint' })
  documentId: string;

  @Column({ name: 'document_code', type: 'nvarchar', length: 200, nullable: true })
  documentCode?: string;

  @Column({ name: 'document_subject', type: 'nvarchar', length: 1000, nullable: true })
  documentSubject?: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt: Date;
}
