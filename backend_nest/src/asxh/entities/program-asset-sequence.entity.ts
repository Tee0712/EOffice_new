import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('program_asset_sequences')
export class ProgramAssetSequenceEntity {
  @PrimaryColumn({ name: 'program_id', type: 'int' })
  programId: number;

  @Column({ name: 'next_asset_no', type: 'int', default: 1 })
  nextAssetNo: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
