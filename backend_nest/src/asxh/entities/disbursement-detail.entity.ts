import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DisbursementEntity } from './disbursement.entity';

@Entity('disbursement_details')
export class DisbursementDetailEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'disbursement_id' })
  disbursementId: number;

  @ManyToOne(() => DisbursementEntity, (disbursement) => disbursement.details)
  @JoinColumn({ name: 'disbursement_id' })
  disbursement: DisbursementEntity;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  expense_content: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;
}
