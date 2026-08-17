import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ProductEntity } from './product.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { OrganizationUnitEntity } from 'src/organization-unit/organization-unit_sql/organization-unit.entity';

@Entity('ProductLimit')
export class ProductLimitEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => OrganizationUnitEntity, { nullable: true })
  @JoinColumn({ name: 'organization_unit_id' })
  organizationUnit: OrganizationUnitEntity;

  @Column({ name: 'organization_unit_id', nullable: true })
  organizationUnitId: string;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  quantity_limit: number;

  @Column()
  limit_month: number;

  @Column()
  limit_year: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
