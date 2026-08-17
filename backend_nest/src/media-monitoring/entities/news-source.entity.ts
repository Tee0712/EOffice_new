import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ArticleEntity } from './article.entity';

export enum NewsSourceType {
  BAO_DIEN_TU = 'bao_dien_tu',
  MXH = 'mxh',
  RSS_FEED = 'rss_feed',
  CONG_TT = 'cong_tt',
  BLOG = 'blog',
}

export enum NewsSourceStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ERROR = 'error',
}

@Entity('mm_news_sources')
export class NewsSourceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'nvarchar', length: 500 })
  url: string;

  @Column({ type: 'nvarchar', length: 50, default: NewsSourceType.RSS_FEED })
  @Index()
  type: NewsSourceType;

  @Column({ type: 'nvarchar', length: 20, default: NewsSourceStatus.ACTIVE })
  @Index()
  status: NewsSourceStatus;

  @Column({ type: 'int', default: 30, name: 'scan_frequency_minutes' })
  scanFrequencyMinutes: number;

  @Column({ type: 'datetime', nullable: true, name: 'last_synced_at' })
  lastSyncedAt: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'last_error_at' })
  lastErrorAt: Date | null;

  @Column({ type: 'int', default: 0, name: 'articles_collected' })
  articlesCollected: number;

  @Column({ type: 'bit', default: 1, name: 'is_enabled' })
  isEnabled: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @OneToMany(() => ArticleEntity, (a) => a.source)
  articles: ArticleEntity[];

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}
