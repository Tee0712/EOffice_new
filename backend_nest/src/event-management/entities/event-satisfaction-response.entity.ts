import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { EventSatisfactionSurveyEntity } from './event-satisfaction-survey.entity';

@Entity('event_satisfaction_responses')
@Unique(['surveyId', 'respondentUserId'])
export class EventSatisfactionResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier', name: 'survey_id' })
  @Index()
  surveyId: string;

  @Column({ type: 'uniqueidentifier', name: 'event_id' })
  @Index()
  eventId: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'respondent_user_id' })
  respondentUserId: string | null;

  @Column({ type: 'nvarchar', length: 200, nullable: true, name: 'respondent_name' })
  respondentName: string | null;

  @Column({ type: 'int', name: 'rating_value' })
  ratingValue: number;

  @Column({ type: 'nvarchar', length: 200, nullable: true, name: 'selected_option' })
  selectedOption: string | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  comment: string | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'department_id' })
  departmentId: string | null;

  @CreateDateColumn({ type: 'datetimeoffset', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => EventSatisfactionSurveyEntity, (survey) => survey.responses)
  @JoinColumn({ name: 'survey_id' })
  survey: EventSatisfactionSurveyEntity;
}

