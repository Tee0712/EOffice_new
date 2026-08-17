import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('university_partner_scholarship_quotas')
export class UniversityPartnerQuotaEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'university_partner_id', type: 'int' })
  university_partner_id: number;

  @Column({ name: 'major_name', type: 'nvarchar', length: 300 })
  major_name: string;

  @Column({ name: 'slots', type: 'int', nullable: true })
  slots: number;

  @Column({ name: 'amount_per_slot', type: 'decimal', precision: 18, scale: 2, nullable: true })
  amount_per_slot: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  created_at: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  created_by: number;
}
