import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BulletinDepartmentEntity } from '../../departments/entities/department.entity';
import { BulletinRoleEntity } from './role.entity';
import { PermissionEntity } from './permission.entity';

@Entity('department_role_permissions')
export class DepartmentRolePermissionEntity {
  @PrimaryColumn()
  department_id: string;

  @PrimaryColumn()
  role_id: string;

  @PrimaryColumn()
  permission_id: string;

  @ManyToOne(() => BulletinDepartmentEntity)
  @JoinColumn({ name: 'department_id' })
  department: BulletinDepartmentEntity;

  @ManyToOne(() => BulletinRoleEntity)
  @JoinColumn({ name: 'role_id' })
  role: BulletinRoleEntity;

  @ManyToOne(() => PermissionEntity)
  @JoinColumn({ name: 'permission_id' })
  permission: PermissionEntity;
}
