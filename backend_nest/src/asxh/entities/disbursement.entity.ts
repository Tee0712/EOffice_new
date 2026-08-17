import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ProgramItemEntity } from './program-item.entity';
import { DisbursementDetailEntity } from './disbursement-detail.entity';
import { DisbursementAttachmentEntity } from './disbursement-attachment.entity';
import { DisbursementReceiverEntity } from './disbursement-receiver.entity';

@Entity('disbursements')
export class DisbursementEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'program_item_id' })
  programItemId: number;

  @ManyToOne(() => ProgramItemEntity, (item) => item.disbursements)
  @JoinColumn({ name: 'program_item_id' })
  programItem: ProgramItemEntity;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  disbursement_content?: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  detailed_description?: string;

  @Column({ type: 'date', nullable: true })
  expected_transfer_date?: Date;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  receiving_unit?: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  notification_type?: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  status?: string;

  @Column({ name: 'receiver_id', type: 'int', nullable: true })
  receiver_id?: number;

  @ManyToOne(() => DisbursementReceiverEntity)
  @JoinColumn({ name: 'receiver_id' })
  receiver: DisbursementReceiverEntity;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  code?: string;

  @Column({ name: 'workflow_key', type: 'nvarchar', length: 255, nullable: true })
  workflowKey?: string;

  @Column({ name: 'current_step_order', type: 'int', default: 1 })
  current_step_order: number;

  @Column({ type: 'int', nullable: true })
  sequence_no?: number;

  @CreateDateColumn({ type: 'datetime2' })
  created_at: Date;

  @OneToMany(() => DisbursementDetailEntity, (detail) => detail.disbursement)
  details: DisbursementDetailEntity[];

  @OneToMany(() => DisbursementAttachmentEntity, (attachment) => attachment.disbursement)
  attachments: DisbursementAttachmentEntity[];
}

