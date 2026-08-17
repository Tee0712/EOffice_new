import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('program_disbursement_sequences')
export class ProgramDisbursementSequenceEntity {
  @PrimaryColumn({ name: 'program_id', type: 'int' })
  programId: number;

  @Column({ name: 'next_sequence_no', type: 'int', default: 1 })
  nextSequenceNo: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2' })
  updatedAt: Date;
}
