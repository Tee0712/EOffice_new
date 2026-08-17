import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { KeywordEntity } from '../entities/keyword.entity';
import { CreateKeywordDto, UpdateKeywordDto, QueryKeywordDto, ReorderKeywordDto } from '../dto/media.dto';

@Injectable()
export class KeywordService implements OnModuleInit {
  constructor(
    @InjectRepository(KeywordEntity, 'mssqlConnection')
    private readonly repo: Repository<KeywordEntity>,
  ) {}

  async onModuleInit() {
    await this.ensureTables();
  }

  private async ensureTables() {
    await this.repo.query(`
      IF OBJECT_ID('dbo.mm_keywords', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mm_keywords (
          id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
          name NVARCHAR(255) NOT NULL,
          [group] NVARCHAR(50) NOT NULL DEFAULT 'thuong_hieu',
          is_active BIT NOT NULL DEFAULT 1,
          is_exclude BIT NOT NULL DEFAULT 0,
          match_count_today INT NOT NULL DEFAULT 0,
          icon_type NVARCHAR(100) NULL,
          priority INT NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE()
        );
      END;
    `);
  }

  async create(dto: CreateKeywordDto): Promise<KeywordEntity> {
    const keyword = this.repo.create(dto);
    return this.repo.save(keyword);
  }

  async findAll(query: QueryKeywordDto) {
    const { group, isActive, search, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<KeywordEntity> = {};
    if (group) where.group = group;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.name = Like(`%${search}%`);

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { priority: 'DESC', createdAt: 'ASC' },
      skip,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<KeywordEntity> {
    const kw = await this.repo.findOne({ where: { id } });
    if (!kw) throw new NotFoundException(`Keyword ${id} not found`);
    return kw;
  }

  async update(id: string, dto: UpdateKeywordDto): Promise<KeywordEntity> {
    await this.findOne(id);
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    await this.findOne(id);
    await this.repo.delete(id);
    return { success: true };
  }

  async toggle(id: string, isActive: boolean): Promise<KeywordEntity> {
    await this.repo.update(id, { isActive });
    return this.findOne(id);
  }

  async reorder(dto: ReorderKeywordDto): Promise<{ success: boolean }> {
    await Promise.all(
      dto.ids.map((id, index) => this.repo.update(id, { priority: dto.ids.length - index })),
    );
    return { success: true };
  }

  async getMatchedArticles(id: string) {
    await this.findOne(id);
    const results = await this.repo.query(`
      SELECT TOP 20 a.id, a.title, a.url, a.sentiment, a.collected_at, m.position, m.snippet
      FROM mm_article_keyword_matches m
      INNER JOIN mm_articles a ON a.id = m.article_id
      WHERE m.keyword_id = @0
      ORDER BY a.collected_at DESC
    `, [id]);
    return results;
  }
}
