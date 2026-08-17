import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ArticleEntity } from './article.entity';
import { KeywordEntity } from './keyword.entity';

export enum KeywordPosition {
  TIEU_DE = 'tieu_de',
  DOAN_1 = 'doan_1',
  DOAN_2 = 'doan_2',
  DOAN_3 = 'doan_3',
  KHAC = 'khac',
}

@Entity('mm_article_keyword_matches')
export class ArticleKeywordMatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', name: 'article_id' })
  @Index()
  articleId: string;

  @Column({ type: 'nvarchar', name: 'keyword_id' })
  @Index()
  keywordId: string;

  @Column({ type: 'nvarchar', length: 50, default: KeywordPosition.KHAC })
  position: KeywordPosition;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  snippet: string | null;

  @ManyToOne(() => ArticleEntity, (a) => a.keywordMatches)
  @JoinColumn({ name: 'article_id' })
  article: ArticleEntity;

  @ManyToOne(() => KeywordEntity, (k) => k.matches)
  @JoinColumn({ name: 'keyword_id' })
  keyword: KeywordEntity;
}
