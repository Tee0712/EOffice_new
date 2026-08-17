import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('birthday_wishes')
export class BirthdayWishEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 100, name: 'user_id' })
  userId: string;

  @Column({ type: 'nvarchar', length: 100, name: 'wished_by' })
  wishedBy: string;

  @Column({ type: 'nvarchar', length: 'max', nullable: true, name: 'message' })
  message: string | null;

  @CreateDateColumn({ type: 'datetime', name: 'wished_at' })
  wishedAt: Date;
  
  @Column({ type: 'int', default: 0, name: 'mail_status' })
  mailStatus: number;
}

