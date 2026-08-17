import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MenuTemplateEntity } from './menu-template.entity';
import { DishEntity } from './dish.entity';

@Entity('menu_template_items')
export class MenuTemplateItemEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  template_id: number;

  @ManyToOne(() => MenuTemplateEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: MenuTemplateEntity;

  @Column({ type: 'int' })
  day_offset: number; // 0 for Monday, 1 for Tuesday, etc.

  @Column({ type: 'nvarchar', length: 50 })
  meal_slot: string; // breakfast, lunch, dinner

  @Column({ type: 'bigint', unsigned: true })
  dish_id: number;

  @ManyToOne(() => DishEntity)
  @JoinColumn({ name: 'dish_id' })
  dish: DishEntity;

  @Column({ type: 'int', default: 0 })
  sort_order: number;
}
