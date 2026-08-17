import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'module_workflow_mappings', schema: 'dbo' })
export class ModuleWorkflowMappingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'menu_id', type: 'varchar', length: 100, unique: true })
  menuId: string;

  @Column({ name: 'workflow_key', type: 'nvarchar', length: 255 })
  workflowKey: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
