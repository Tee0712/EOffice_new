import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MenuEntity } from './menu.entity';

@Entity('meal_evaluations')
export class MealEvaluationEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'nvarchar', length: 100 })
  userId: string;

  @Column({ name: 'menu_id', type: 'bigint' })
  menuId: number;

  @Column({ name: 'supplier_id', type: 'bigint', nullable: true })
  supplierId: number | null;

  @Column({ name: 'supplier_order_id', type: 'bigint', nullable: true })
  supplierOrderId: number | null;


  @Column({ name: 'taste_score', type: 'tinyint' })
  tasteScore: number;

  @Column({ name: 'hygiene_score', type: 'tinyint' })
  hygieneScore: number;

  @Column({ name: 'portion_score', type: 'tinyint' })
  portionScore: number;

  @Column({ name: 'diversity_score', type: 'tinyint' })
  diversityScore: number;

  @Column({ name: 'service_score', type: 'tinyint' })
  serviceScore: number;

  @Column({ name: 'overall_score', type: 'decimal', precision: 3, scale: 2 })
  overallScore: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ name: 'images_json', type: 'nvarchar', length: 'max', nullable: true })
  imagesJson: string | null;


  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => MenuEntity)
  @JoinColumn({ name: 'menu_id' })
  menu: MenuEntity;
}
