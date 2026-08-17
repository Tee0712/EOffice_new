import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DisbursementEntity } from './disbursement.entity';

@Entity('program_items')
export class ProgramItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'program_id', type: 'int' })
  program_id: number;

  @Column({ name: 'name', type: 'nvarchar', length: 500 })
  name: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 18, scale: 2 })
  unit_price: number;

  @Column({ name: 'quantity', type: 'int' })
  quantity: number;

  @OneToMany(() => DisbursementEntity, (d) => d.programItem)
  disbursements: DisbursementEntity[];
}
