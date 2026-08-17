import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { GuestRegistrationEntity } from './guest-registration.entity';

export enum GuestType {
  VIP = 'VIP',
  PARTNER = 'PARTNER',
  REGULAR = 'REGULAR',
}

@Entity('event_guests')
export class EventGuestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 200, name: 'full_name' })
  fullName: string;

  @Column({ type: 'nvarchar', length: 300, nullable: true })
  organization: string | null;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  title: string | null;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  @Index()
  phone: string | null;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  @Index()
  email: string | null;

  @Column({ type: 'nvarchar', length: 30, nullable: true, name: 'guest_type' })
  guestType: GuestType | null;

  @CreateDateColumn({ type: 'datetimeoffset', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetimeoffset', nullable: true, name: 'updated_at' })
  updatedAt: Date | null;

  @OneToMany(() => GuestRegistrationEntity, (r) => r.guest)
  registrations: GuestRegistrationEntity[];
}
