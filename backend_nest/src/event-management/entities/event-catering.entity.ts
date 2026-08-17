import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EventLogisticsEntity } from './event-logistics.entity';

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK',
}

@Entity('event_catering')
export class EventCateringEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'logistics_id' })
  logisticsId: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true, name: 'meal_type' })
  mealType: MealType | null;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  venue: string | null;

  @Column({ type: 'datetimeoffset', nullable: true, name: 'meal_time' })
  mealTime: Date | null;

  @Column({ type: 'int', nullable: true, name: 'pax_count' })
  paxCount: number | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'menu_description' })
  menuDescription: string | null;

  @Column({ type: 'nvarchar', length: 300, nullable: true })
  supplier: string | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'datetimeoffset', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => EventLogisticsEntity, (l) => l.caterings)
  @JoinColumn({ name: 'logistics_id' })
  logistics: EventLogisticsEntity;
}
