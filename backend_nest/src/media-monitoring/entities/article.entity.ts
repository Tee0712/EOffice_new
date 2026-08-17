import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { NewsSourceEntity } from './news-source.entity';
import { ArticleKeywordMatchEntity } from './article-keyword-match.entity';
import { ArticleTagEntity } from './article-tag.entity';
import { ArticleProcessingEntity } from './article-processing.entity';

export enum ArticleSentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

export enum ArticleSeverity {
  KHAN = 'khan',
  CAO = 'cao',
  TRUNG_BINH = 'trung_binh',
  THAP = 'thap',
}

export enum ArticleStatus {
  MOI = 'moi',
  DANG_XEM = 'dang_xem',
  CAN_THEO_DOI = 'can_theo_doi',
  DA_XU_LY = 'da_xu_ly',
  DA_XEM = 'da_xem',
}

@Entity('mm_articles')
export class ArticleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', name: 'source_id' })
  @Index()
  sourceId: string;

  @Column({ type: 'nvarchar', length: 500 })
  title: string;

  @Column({ type: 'nvarchar', length: 1000 })
  url: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  content: string | null;

  @Column({ type: 'datetime', nullable: true, name: 'published_at' })
  publishedAt: Date | null;

  @Column({ type: 'datetime', name: 'collected_at', default: () => 'GETDATE()' })
  @Index()
  collectedAt: Date;

  @Column({ type: 'nvarchar', length: 20, default: ArticleSentiment.NEUTRAL })
  @Index()
  sentiment: ArticleSentiment;

  @Column({ type: 'float', nullable: true, name: 'sentiment_score' })
  sentimentScore: number | null;

  @Column({ type: 'nvarchar', length: 20, default: ArticleSeverity.THAP })
  severity: ArticleSeverity;

  @Column({ type: 'nvarchar', length: 20, default: ArticleStatus.MOI })
  @Index()
  status: ArticleStatus;

  @Column({ type: 'int', default: 0, name: 'estimated_reach' })
  estimatedReach: number;

  @Column({ type: 'bit', default: 0, name: 'is_viral' })
  isViral: boolean;

  @ManyToOne(() => NewsSourceEntity, (s) => s.articles)
  @JoinColumn({ name: 'source_id' })
  source: NewsSourceEntity;

  @OneToMany(() => ArticleKeywordMatchEntity, (m: ArticleKeywordMatchEntity) => m.article, { cascade: true })
  keywordMatches: ArticleKeywordMatchEntity[];

  @OneToMany(() => ArticleTagEntity, (t: ArticleTagEntity) => t.article, { cascade: true })
  tags: ArticleTagEntity[];

  @OneToOne(() => ArticleProcessingEntity, (p) => p.article)
  processing: ArticleProcessingEntity;

  @Column({ type: 'datetime', name: 'created_at', default: () => 'GETDATE()' })
  createdAt: Date;
}

