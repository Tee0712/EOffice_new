import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ArticleEntity } from './article.entity';

export enum ProcessingPriority {
  KHAN = 'khan',
  CAO = 'cao',
  TB = 'tb',
  THAP = 'thap',
}

@Entity('mm_article_processing')
export class ArticleProcessingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', name: 'article_id', unique: true })
  @Index()
  articleId: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'processed_by' })
  processedBy: string | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'internal_note' })
  internalNote: string | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'response_suggestion' })
  responseSuggestion: string | null;

  @Column({ type: 'nvarchar', length: 20, default: ProcessingPriority.THAP, name: 'priority_level' })
  priorityLevel: ProcessingPriority;

  @Column({ type: 'datetime', nullable: true, name: 'processed_at' })
  processedAt: Date | null;

  @Column({ type: 'bit', default: 0 })
  escalated: boolean;

  // Stored as JSON string: department IDs array
  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'forwarded_departments' })
  forwardedDepartments: string | null;

  @OneToOne(() => ArticleEntity, (a) => a.processing)
  @JoinColumn({ name: 'article_id' })
  article: ArticleEntity;
}
