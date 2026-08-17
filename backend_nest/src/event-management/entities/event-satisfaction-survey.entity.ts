import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EventEntity } from './event.entity';
import { EventSatisfactionResponseEntity } from './event-satisfaction-response.entity';

@Entity('event_satisfaction_surveys')
export class EventSatisfactionSurveyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'event_id' })
  @Index({ unique: true })
  eventId: string;

  @Column({ type: 'nvarchar', length: 300 })
  title: string;

  @Column({ type: 'nvarchar', length: 'MAX' })
  question: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'options_json' })
  optionsJson: string | null;

  @Column({ type: 'bit', default: 1, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'bit', default: 1, name: 'allow_comment' })
  allowComment: boolean;

  @Column({ type: 'bit', default: 0, name: 'is_anonymous' })
  isAnonymous: boolean;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'created_by' })
  createdBy: string | null;

  @CreateDateColumn({ type: 'datetimeoffset', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetimeoffset', nullable: true, name: 'updated_at' })
  updatedAt: Date | null;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @OneToMany(() => EventSatisfactionResponseEntity, (response) => response.survey)
  responses: EventSatisfactionResponseEntity[];
}

