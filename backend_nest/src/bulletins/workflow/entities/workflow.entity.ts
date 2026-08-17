import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BulletinDepartmentEntity } from '../../departments/entities/department.entity';

export enum ApproverType {
  BY_ROLE = 'BY_ROLE',
  BY_USER = 'BY_USER',
}

@Entity('department_approval_workflows')
export class DepartmentApprovalWorkflowEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  department_id: string;

  @Column({ type: 'int', name: 'step_order' })
  step_order: number;

  @Column({
    type: 'nvarchar',
    length: 50,
    enum: ApproverType
  })
  approver_type: ApproverType;

  @Column({ type: 'nvarchar', length: 100, name: 'approver_id' })
  approver_id: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true, name: 'step_name' })
  step_name: string | null;

  @Column({ type: 'int', nullable: true, name: 'sla_hours' })
  sla_hours: number | null;

  @Column({ type: 'bit', default: true, name: 'is_required' })
  is_required: boolean;

  @Column({ type: 'int', default: 1, name: 'min_approvals' })
  min_approvals: number;

  @Column({ type: 'bit', default: false, name: 'can_auto_publish' })
  can_auto_publish: boolean;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'publish_channel' })
  publish_channel: string | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'notify_scope' })
  notify_scope: string | null;

  @Column({ type: 'nvarchar', length: 50, default: 'RETURN_TO_DRAFT', name: 'on_reject_action' })
  on_reject_action: string;

  @Column({ type: 'bit', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'config_json' })
  config_json: string | null;

  @ManyToOne(() => BulletinDepartmentEntity)
  @JoinColumn({ name: 'department_id' })
  department: BulletinDepartmentEntity;
}
