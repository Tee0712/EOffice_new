import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('scholarship_candidate_sequences')
export class ScholarshipCandidateSequenceEntity {
  @PrimaryColumn({ name: 'year', type: 'int' })
  year: number;

  @Column({ name: 'next_candidate_no', type: 'int', default: 1 })
  next_candidate_no: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2', precision: 0 })
  updated_at: Date;
}
