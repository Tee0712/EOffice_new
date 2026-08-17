import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'workflows', schema: 'dbo' })
export class WorkflowEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'process_key', type: 'nvarchar', length: 255 })
  processKey: string;

  @Column({ name: 'step_order', type: 'int' })
  stepOrder: number;

  @Column({ name: 'role_code', type: 'nvarchar', length: 100 })
  roleCode: string;

  @Column({ name: 'name', type: 'nvarchar', length: 255, nullable: true })
  name: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
