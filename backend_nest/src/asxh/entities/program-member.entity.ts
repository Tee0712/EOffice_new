import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('program_members')
export class ProgramMemberEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'program_id', type: 'int' })
  program_id: number;

  @Column({ name: 'user_id', type: 'nvarchar', length: 50 })
  user_id: string;

  @Column({ name: 'role', type: 'nvarchar', length: 50 })
  role: string;
}
