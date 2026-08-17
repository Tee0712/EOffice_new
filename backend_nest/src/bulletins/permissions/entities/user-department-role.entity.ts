import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { UserEntity } from '../../../users/entities/user.entity';
import { BulletinDepartmentEntity } from '../../departments/entities/department.entity';
import { BulletinRoleEntity } from './role.entity';

@Entity('user_department_roles')
export class UserDepartmentRoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 100 })
  user_id: string;

  @Column()
  department_id: string;

  @Column()
  role_id: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => BulletinDepartmentEntity)
  @JoinColumn({ name: 'department_id' })
  department: BulletinDepartmentEntity;

  @ManyToOne(() => BulletinRoleEntity)
  @JoinColumn({ name: 'role_id' })
  role: BulletinRoleEntity;

  @CreateDateColumn({ type: 'datetime', name: 'joined_at' })
  joinedAt: Date;
}
