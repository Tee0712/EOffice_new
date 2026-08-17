import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AssetEntity } from './asset.entity';

@Entity('asset_specifications')
export class AssetSpecificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'asset_id', type: 'int' })
  assetId: number;

  @Column({ name: 'parameter_name', type: 'nvarchar', length: 255 })
  parameterName: string;

  @Column({ name: 'value', type: 'nvarchar', length: 500 })
  value: string;

  @ManyToOne(() => AssetEntity, (a) => a.specifications)
  @JoinColumn({ name: 'asset_id' })
  asset: AssetEntity;
}
