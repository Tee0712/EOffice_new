import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('handover_logs')
export class HandoverLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'handover_asset_id', type: 'int' })
  handoverAssetId: number;

  @Column({ name: 'created_by_id', type: 'nvarchar', length: 50, nullable: true })
  createdById?: string;

  @Column({ name: 'action', type: 'nvarchar', length: 255, nullable: true })
  action?: string;

  @Column({ name: 'created_at', type: 'datetime2', default: () => 'GETDATE()' })
  createdAt: Date;
}
