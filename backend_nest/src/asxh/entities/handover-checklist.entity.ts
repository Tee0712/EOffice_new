import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('handover_checklists')
export class HandoverChecklistEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'handover_asset_id', type: 'int' })
  handoverAssetId: number;

  @Column({ name: 'name', type: 'nvarchar', length: 500 })
  name: string;

  @Column({ name: 'checklist_type', type: 'nvarchar', length: 50, nullable: true })
  checklistType?: string; // REQUIRED, OPTIONAL

  @Column({ name: 'is_done', type: 'bit', default: 0 })
  isDone: boolean;
}
