import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('system_settings')
@Unique(['group', 'key'])
export class SystemSettingEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'nvarchar', length: 50 })
  group: string;

  @Column({ type: 'nvarchar', length: 100 })
  key: string;

  @Column({ type: 'nvarchar', length: 'max' })
  value: string;

  @Column({
    type: 'nvarchar',
    length: 50,
    default: 'string',
  })
  value_type: 'string' | 'integer' | 'decimal' | 'boolean' | 'time' | 'json';

  @Column({ type: 'nvarchar', length: 150, nullable: true })
  label: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'tinyint', default: 0 })
  is_public: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
