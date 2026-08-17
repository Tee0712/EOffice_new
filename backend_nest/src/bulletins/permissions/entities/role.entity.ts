import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('bulletin_roles')
export class BulletinRoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;
}
