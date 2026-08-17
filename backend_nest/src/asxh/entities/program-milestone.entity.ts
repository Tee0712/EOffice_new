import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('program_milestones')
export class ProgramMilestoneEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'program_id', type: 'int' })
  program_id: number;

  @Column({ name: 'milestone_name', type: 'nvarchar', length: 500 })
  milestone_name: string;

  @Column({ name: 'milestone_date', type: 'date' })
  milestone_date: Date;

  @Column({ name: 'milestone_type', type: 'nvarchar', length: 50 })
  milestone_type: string;
}
