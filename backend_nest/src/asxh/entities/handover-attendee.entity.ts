import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('handover_attendees')
export class HandoverAttendeeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'handover_asset_id', type: 'int' })
  handoverAssetId: number;

  @Column({ name: 'user_id', type: 'nvarchar', length: 50 })
  userId: string;

  @Column({ name: 'role', type: 'nvarchar', length: 200, nullable: true })
  role?: string;
}
