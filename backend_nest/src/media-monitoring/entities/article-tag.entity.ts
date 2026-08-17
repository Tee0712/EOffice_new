import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ArticleEntity } from './article.entity';

export enum TagType {
  KEYWORD = 'keyword',
  MANUAL = 'manual',
}

@Entity('mm_article_tags')
export class ArticleTagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', name: 'article_id' })
  @Index()
  articleId: string;

  @Column({ type: 'nvarchar', length: 255 })
  tag: string;

  @Column({ type: 'nvarchar', length: 20, default: TagType.KEYWORD, name: 'tag_type' })
  tagType: TagType;

  @ManyToOne(() => ArticleEntity, (a) => a.tags)
  @JoinColumn({ name: 'article_id' })
  article: ArticleEntity;
}
