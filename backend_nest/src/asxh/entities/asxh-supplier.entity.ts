import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { AssetEntity } from './asset.entity';

@Entity('asxh_suppliers')
export class AsxhSupplierEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'nvarchar', length: 500 })
  name: string;

  @Column({ name: 'tax_code', type: 'nvarchar', length: 50, nullable: true })
  taxCode?: string;

  @Column({ name: 'address', type: 'nvarchar', length: 'max', nullable: true })
  address?: string;

  @Column({ name: 'phone', type: 'nvarchar', length: 50, nullable: true })
  phone?: string;

  @Column({ name: 'email', type: 'nvarchar', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'contact_person', type: 'nvarchar', length: 200, nullable: true })
  contactPerson?: string;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: number;

  @Column({ name: 'notes', type: 'nvarchar', length: 'max', nullable: true })
  notes?: string;

  @Column({ name: 'supplier_type', type: 'nvarchar', length: 100, nullable: true })
  supplierType?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'nvarchar', length: 100, nullable: true })
  createdBy: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', nullable: true })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'nvarchar', length: 100, nullable: true })
  updatedBy: string;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date;

  @Column({ name: 'deleted_by', type: 'nvarchar', length: 100, nullable: true })
  deletedBy: string;

  @OneToMany(() => AssetEntity, (asset) => asset.supplierRelation)
  assets: AssetEntity[];
}
