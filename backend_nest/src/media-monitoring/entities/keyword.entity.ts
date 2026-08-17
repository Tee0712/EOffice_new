import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ArticleKeywordMatchEntity } from './article-keyword-match.entity';

export enum KeywordGroup {
  THUONG_HIEU = 'thuong_hieu',
  CHU_DE = 'chu_de',
  RUI_RO = 'rui_ro',
  LOAI_TRU = 'loai_tru',
}

@Entity('mm_keywords')
export class KeywordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'nvarchar', length: 50, default: KeywordGroup.THUONG_HIEU })
  @Index()
  group: KeywordGroup;

  @Column({ type: 'bit', default: 1, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'bit', default: 0, name: 'is_exclude' })
  isExclude: boolean;

  @Column({ type: 'int', default: 0, name: 'match_count_today' })
  matchCountToday: number;

  @Column({ type: 'nvarchar', length: 100, nullable: true, name: 'icon_type' })
  iconType: string | null;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @OneToMany(() => ArticleKeywordMatchEntity, (m: ArticleKeywordMatchEntity) => m.keyword)
  matches: ArticleKeywordMatchEntity[];

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}
