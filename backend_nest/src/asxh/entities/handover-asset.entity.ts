import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { AssetEntity } from './asset.entity';

@Entity('handover_assets')
export class HandoverAssetEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'program_id', type: 'int' })
  programId: number;

  @Column({ name: 'event_name', type: 'nvarchar', length: 500, nullable: true })
  eventName?: string;

  @Column({ name: 'handover_date', type: 'date', nullable: true })
  handoverDate?: Date;

  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime?: string;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime?: string;

  @Column({ name: 'location', type: 'nvarchar', length: 500, nullable: true })
  location?: string;

  @Column({ name: 'event_type', type: 'nvarchar', length: 50, nullable: true })
  eventType?: string;

  @Column({ name: 'format', type: 'nvarchar', length: 50, nullable: true })
  format?: string;

  @Column({ name: 'notes', type: 'nvarchar', length: 'MAX', nullable: true })
  notes?: string;

  @Column({ name: 'representative_name', type: 'nvarchar', length: 200, nullable: true })
  representativeName?: string;

  @Column({ name: 'representative_title', type: 'nvarchar', length: 200, nullable: true })
  representativeTitle?: string;

  @Column({ name: 'representative_phone', type: 'nvarchar', length: 50, nullable: true })
  representativePhone?: string;

  @Column({ name: 'representative_email', type: 'nvarchar', length: 255, nullable: true })
  representativeEmail?: string;

  @Column({ name: 'status', type: 'nvarchar', length: 50, nullable: true })
  status?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => AssetEntity, (a) => a.handoverEvent)
  assets: AssetEntity[];
}
