import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AssetEntity } from './asset.entity';

@Entity('asset_attachments')
export class AssetAttachmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'asset_id', type: 'int' })
  assetId: number;

  @Column({ name: 'title', type: 'nvarchar', length: 500 })
  title: string;

  @Column({ name: 'path', type: 'nvarchar', length: 1000 })
  path: string;

  @Column({ name: 'doc_type', type: 'nvarchar', length: 100, nullable: true })
  docType?: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @ManyToOne(() => AssetEntity, (a) => a.attachments)
  @JoinColumn({ name: 'asset_id' })
  asset: AssetEntity;
}
