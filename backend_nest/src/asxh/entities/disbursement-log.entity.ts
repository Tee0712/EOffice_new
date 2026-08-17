import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DisbursementEntity } from './disbursement.entity';

@Entity('disbursement_logs')
export class DisbursementLogEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'disbursement_id' })
  disbursementId: number;

  @ManyToOne(() => DisbursementEntity)
  @JoinColumn({ name: 'disbursement_id' })
  disbursement: DisbursementEntity;

  @Column({ name: 'sender_id', type: 'nvarchar', length: 100, nullable: true })
  senderId: string;

  @Column({ type: 'nvarchar', length: 100 })
  action: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  note: string;

  @CreateDateColumn({ type: 'datetime2' })
  created_at: Date;
}
