import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from 'src/users/entities/user.entity';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  user_id: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity | null;

  @Column({ type: 'nvarchar', length: 50 })
  action: string; // create, update, delete, auto_cut, checkin, cancel, publish, approve

  @Column({ type: 'nvarchar', length: 50 })
  target_table: string;

  @Column({ type: 'bigint', unsigned: true })
  target_id: number;

  @Column({
    type: 'nvarchar',
    length: 'MAX',
    nullable: true,
    transformer: {
      to: (value: any) => (value ? JSON.stringify(value) : null),
      from: (value: string) => {
        try { return value ? JSON.parse(value) : null; } catch { return null; }
      },
    },
  })
  old_value: any;

  @Column({
    type: 'nvarchar',
    length: 'MAX',
    nullable: true,
    transformer: {
      to: (value: any) => (value ? JSON.stringify(value) : null),
      from: (value: string) => {
        try { return value ? JSON.parse(value) : null; } catch { return null; }
      },
    },
  })
  new_value: any;

  @Column({ type: 'nvarchar', length: 45, nullable: true })
  ip_address: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  user_agent: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  note: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
