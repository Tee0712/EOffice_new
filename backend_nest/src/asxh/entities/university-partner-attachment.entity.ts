import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('university_partner_attachments')
export class UniversityPartnerAttachmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'university_partner_id', type: 'int' })
  university_partner_id: number;

  @Column({ name: 'title', type: 'nvarchar', length: 500 })
  title: string;

  @Column({ name: 'path', type: 'nvarchar', length: 1000 })
  path: string;

  @Column({ name: 'doc_type', type: 'nvarchar', length: 100, nullable: true })
  doc_type: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'datetime2' })
  uploaded_at: Date;

  @Column({ name: 'uploaded_by', type: 'int', nullable: true })
  uploaded_by: number;
}
