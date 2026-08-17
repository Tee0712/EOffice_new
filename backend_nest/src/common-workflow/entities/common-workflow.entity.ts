import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'common_workflows', schema: 'dbo' })
export class CommonWorkflowEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 100, name: 'department_id' })
  departmentId: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true, name: 'module_type' })
  moduleType: string;

  @Column({ type: 'int', name: 'step_order' })
  stepOrder: number;

  @Column({ type: 'nvarchar', length: 50, default: 'USER', name: 'approver_type' })
  approverType: string;

  @Column({ type: 'nvarchar', length: 100, name: 'approver_id' })
  approverId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
