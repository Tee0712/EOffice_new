import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DisbursementEntity } from './disbursement.entity';

@Entity('disbursement_attachments')
export class DisbursementAttachmentEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'disbursement_id' })
  disbursementId: number;

  @ManyToOne(() => DisbursementEntity, (disbursement) => disbursement.attachments)
  @JoinColumn({ name: 'disbursement_id' })
  disbursement: DisbursementEntity;

  @Column({ type: 'nvarchar', length: 500 })
  title: string;

  @Column({ type: 'nvarchar', length: 1000 })
  path: string;

  @Column({ name: 'doc_type', type: 'nvarchar', length: 100, nullable: true })
  docType: string;

  @CreateDateColumn({ type: 'datetime2' })
  uploaded_at: Date;
}
