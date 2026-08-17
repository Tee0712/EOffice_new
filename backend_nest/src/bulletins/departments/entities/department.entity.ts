import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('bulletin_departments')
export class BulletinDepartmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  code: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  color: string;

  @Column({ type: 'nvarchar', length: 'max', nullable: true, name: 'default_permissions' })
  defaultPermissions: string; // Store as JSON string or comma-separated

  @Column({ type: 'bit', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;
}
