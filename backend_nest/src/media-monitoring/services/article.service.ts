import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleEntity, ArticleSentiment, ArticleStatus } from '../entities/article.entity';
import { QueryArticleDto, UpdateArticleStatusDto, BatchUpdateArticleDto } from '../dto/media.dto';

@Injectable()
export class ArticleService implements OnModuleInit {
  constructor(
    @InjectRepository(ArticleEntity, 'mssqlConnection')
    private readonly repo: Repository<ArticleEntity>,
  ) {}

  async onModuleInit() {
    await this.ensureTables();
  }

  private async ensureTables() {
    await this.repo.query(`
      IF OBJECT_ID('dbo.mm_articles', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mm_articles (
          id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
          source_id NVARCHAR(100) NOT NULL,
          title NVARCHAR(500) NOT NULL,
          url NVARCHAR(1000) NOT NULL,
          content NVARCHAR(MAX) NULL,
          published_at DATETIME NULL,
          collected_at DATETIME NOT NULL DEFAULT GETDATE(),
          sentiment NVARCHAR(20) NOT NULL DEFAULT 'neutral',
          sentiment_score FLOAT NULL,
          severity NVARCHAR(20) NOT NULL DEFAULT 'thap',
          status NVARCHAR(20) NOT NULL DEFAULT 'moi',
          estimated_reach INT NOT NULL DEFAULT 0,
          is_viral BIT NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT GETDATE()
        );
        CREATE INDEX IX_mm_articles_status ON dbo.mm_articles(status);
        CREATE INDEX IX_mm_articles_sentiment ON dbo.mm_articles(sentiment);
        CREATE INDEX IX_mm_articles_collected_at ON dbo.mm_articles(collected_at DESC);
        CREATE INDEX IX_mm_articles_source_id ON dbo.mm_articles(source_id);
      END;

      IF OBJECT_ID('dbo.mm_article_keyword_matches', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mm_article_keyword_matches (
          id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
          article_id NVARCHAR(100) NOT NULL,
          keyword_id NVARCHAR(100) NOT NULL,
          position NVARCHAR(50) NOT NULL DEFAULT 'khac',
          snippet NVARCHAR(500) NULL
        );
        CREATE INDEX IX_mm_akm_article_id ON dbo.mm_article_keyword_matches(article_id);
        CREATE INDEX IX_mm_akm_keyword_id ON dbo.mm_article_keyword_matches(keyword_id);
      END;

      IF OBJECT_ID('dbo.mm_article_tags', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mm_article_tags (
          id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
          article_id NVARCHAR(100) NOT NULL,
          tag NVARCHAR(255) NOT NULL,
          tag_type NVARCHAR(20) NOT NULL DEFAULT 'keyword'
        );
        CREATE INDEX IX_mm_article_tags_article_id ON dbo.mm_article_tags(article_id);
      END;

      IF OBJECT_ID('dbo.mm_article_processing', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mm_article_processing (
          id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
          article_id NVARCHAR(100) NOT NULL UNIQUE,
          processed_by NVARCHAR(100) NULL,
          internal_note NVARCHAR(MAX) NULL,
          response_suggestion NVARCHAR(MAX) NULL,
          priority_level NVARCHAR(20) NOT NULL DEFAULT 'thap',
          processed_at DATETIME NULL,
          escalated BIT NOT NULL DEFAULT 0,
          forwarded_departments NVARCHAR(MAX) NULL
        );
      END;
    `);
  }

  async findAll(query: QueryArticleDto) {
    const {
      sourceId, sentiment, status, severity, keywordId, search,
      dateFrom, dateTo, sortBy = 'collected_at', sortOrder = 'DESC',
      page = 1, limit = 50,
    } = query;
    const skip = (page - 1) * limit;

    let sql = `
      SELECT a.*, s.name as source_name, s.type as source_type
      FROM mm_articles a
      LEFT JOIN mm_news_sources s ON s.id = a.source_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let pi = 0;

    if (sourceId) { sql += ` AND a.source_id = @${pi++}`; params.push(sourceId); }
    if (sentiment) { sql += ` AND a.sentiment = @${pi++}`; params.push(sentiment); }
    if (status) { sql += ` AND a.status = @${pi++}`; params.push(status); }
    if (severity) { sql += ` AND a.severity = @${pi++}`; params.push(severity); }
    if (search) { sql += ` AND a.title LIKE @${pi++}`; params.push(`%${search}%`); }
    if (dateFrom) { sql += ` AND a.collected_at >= @${pi++}`; params.push(dateFrom); }
    if (dateTo) { sql += ` AND a.collected_at <= @${pi++}`; params.push(dateTo); }
    if (keywordId) {
      sql += ` AND EXISTS (SELECT 1 FROM mm_article_keyword_matches m WHERE m.article_id = a.id AND m.keyword_id = @${pi++})`;
      params.push(keywordId);
    }

    const countSql = sql.replace(
      'SELECT a.*, s.name as source_name, s.type as source_type',
      'SELECT COUNT(*) as total',
    );
    const countResult = await this.repo.query(countSql, params);
    const total = parseInt(countResult[0]?.total || '0');

    const validSort = ['collected_at', 'published_at', 'sentiment_score', 'estimated_reach'];
    const safeSort = validSort.includes(sortBy) ? sortBy : 'collected_at';
    const safeOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY a.${safeSort} ${safeOrder}`;
    sql += ` OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`;

    const items = await this.repo.query(sql, params);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const article = await this.repo.findOne({
      where: { id },
      relations: ['source', 'keywordMatches', 'keywordMatches.keyword', 'tags', 'processing'],
    });
    if (!article) throw new NotFoundException(`Article ${id} not found`);
    return article;
  }

  async updateStatus(id: string, dto: UpdateArticleStatusDto, userId: string) {
    await this.findOne(id);
    await this.repo.update(id, { status: dto.status });
    return this.repo.findOne({ where: { id } });
  }

  async batchUpdateStatus(dto: BatchUpdateArticleDto) {
    if (!dto.ids.length) return { updated: 0 };
    await Promise.all(dto.ids.map((id) => this.repo.update(id, { status: dto.status })));
    return { updated: dto.ids.length };
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, newToday, negative, needsFollowUp, processed] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { collectedAt: today as any } }),
      this.repo.count({ where: { sentiment: ArticleSentiment.NEGATIVE } }),
      this.repo.count({ where: { status: ArticleStatus.CAN_THEO_DOI } }),
      this.repo.count({ where: { status: ArticleStatus.DA_XU_LY } }),
    ]);

    return { total, newToday, negative, needsFollowUp, processed };
  }

  async getNeighbors(id: string) {
    const current = await this.repo.findOne({ where: { id }, select: ['id', 'collectedAt'] });
    if (!current) throw new NotFoundException();

    const [prev, next] = await Promise.all([
      this.repo.createQueryBuilder('a')
        .where('a.collectedAt < :at', { at: current.collectedAt })
        .orderBy('a.collectedAt', 'DESC')
        .select('a.id')
        .getOne(),
      this.repo.createQueryBuilder('a')
        .where('a.collectedAt > :at', { at: current.collectedAt })
        .orderBy('a.collectedAt', 'ASC')
        .select('a.id')
        .getOne(),
    ]);

    return { prevId: prev?.id ?? null, nextId: next?.id ?? null };
  }
}
