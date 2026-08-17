import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('departments2')
export class Department2Entity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;
}
