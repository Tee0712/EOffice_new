import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProgramEntity } from './program.entity';
import { AsxhSupplierEntity } from './asxh-supplier.entity';


@Entity('assets')
export class AssetEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'program_id', type: 'int' })
  programId: number;

  @Column({ name: 'name', type: 'nvarchar', length: 500 })
  name: string;

  @Column({ name: 'code', type: 'nvarchar', length: 100, nullable: true })
  code?: string;

  @Column({ name: 'category', type: 'nvarchar', length: 100, nullable: true })
  category?: string;

  @Column({ name: 'unit', type: 'nvarchar', length: 50, nullable: true })
  unit?: string;

  @Column({ name: 'description', type: 'nvarchar', length: 'MAX', nullable: true })
  description?: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 18, scale: 2, nullable: true })
  unitPrice?: number;

  @Column({ name: 'quantity', type: 'int', nullable: true })
  quantity?: number;

  @Column({ name: 'required_receipt_date', type: 'date', nullable: true })
  requiredReceiptDate?: Date;

  @Column({ name: 'special_requirements', type: 'nvarchar', length: 255, nullable: true })
  specialRequirements?: string;

  @Column({ name: 'supplier', type: 'nvarchar', length: 255, nullable: true })
  supplier?: string;

  @Column({ name: 'has_official_quote', type: 'bit', default: 0 })
  hasOfficialQuote?: boolean;

  @Column({ name: 'status', type: 'nvarchar', length: 50, nullable: true })
  status?: string;

  @Column({ name: 'handover_asset_id', type: 'int', nullable: true })
  handoverAssetId?: number | null;

  @Column({ name: 'supplier_id', type: 'int', nullable: true })
  supplierId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ProgramEntity)
  @JoinColumn({ name: 'program_id' })
  program: ProgramEntity;

  @ManyToOne('HandoverAssetEntity', 'assets')
  @JoinColumn({ name: 'handover_asset_id' })
  handoverEvent: any;

  @ManyToOne(() => AsxhSupplierEntity)
  @JoinColumn({ name: 'supplier_id' })
  supplierRelation: AsxhSupplierEntity;

  @OneToMany('AssetSpecificationEntity', 'asset')
  specifications: any[];

  @OneToMany('AssetAttachmentEntity', 'asset')
  attachments: any[];
}
