import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('university_partner_contacts')
export class UniversityPartnerContactEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'university_partner_id', type: 'int' })
  university_partner_id: number;

  @Column({ name: 'full_name', type: 'nvarchar', length: 200 })
  full_name: string;

  @Column({ name: 'title', type: 'nvarchar', length: 200, nullable: true })
  title: string;

  @Column({ name: 'phone', type: 'nvarchar', length: 50, nullable: true })
  phone: string;

  @Column({ name: 'email', type: 'nvarchar', length: 255, nullable: true })
  email: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  created_at: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  created_by: number;
}
