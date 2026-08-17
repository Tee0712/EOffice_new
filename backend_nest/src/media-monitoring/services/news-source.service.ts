import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { NewsSourceEntity, NewsSourceStatus, NewsSourceType } from '../entities/news-source.entity';
import { CreateNewsSourceDto, UpdateNewsSourceDto, QueryNewsSourceDto } from '../dto/media.dto';

@Injectable()
export class NewsSourceService implements OnModuleInit {
  constructor(
    @InjectRepository(NewsSourceEntity, 'mssqlConnection')
    private readonly repo: Repository<NewsSourceEntity>,
  ) {}

  async onModuleInit() {
    await this.ensureTables();
  }

  private async ensureTables() {
    await this.repo.query(`
      IF OBJECT_ID('dbo.mm_news_sources', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.mm_news_sources (
          id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
          name NVARCHAR(255) NOT NULL,
          url NVARCHAR(500) NOT NULL,
          type NVARCHAR(50) NOT NULL DEFAULT 'rss_feed',
          status NVARCHAR(20) NOT NULL DEFAULT 'active',
          scan_frequency_minutes INT NOT NULL DEFAULT 30,
          last_synced_at DATETIME NULL,
          last_error_at DATETIME NULL,
          articles_collected INT NOT NULL DEFAULT 0,
          is_enabled BIT NOT NULL DEFAULT 1,
          priority INT NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE()
        );
      END;
    `);
  }

  async create(dto: CreateNewsSourceDto): Promise<NewsSourceEntity> {
    const source = this.repo.create(dto);
    return this.repo.save(source);
  }

  async findAll(query: QueryNewsSourceDto) {
    const { type, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<NewsSourceEntity> = {};
    if (type) where.type = type;
    if (search) where.name = Like(`%${search}%`);

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { priority: 'DESC', createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<NewsSourceEntity> {
    const source = await this.repo.findOne({ where: { id } });
    if (!source) throw new NotFoundException(`News source ${id} not found`);
    return source;
  }

  async update(id: string, dto: UpdateNewsSourceDto): Promise<NewsSourceEntity> {
    await this.findOne(id);
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    await this.findOne(id);
    await this.repo.delete(id);
    return { success: true };
  }

  async toggle(id: string, isEnabled: boolean): Promise<NewsSourceEntity> {
    await this.repo.update(id, { isEnabled });
    return this.findOne(id);
  }

  async syncAll(): Promise<{ synced: number; message: string }> {
    const sources = await this.repo.find({ where: { isEnabled: true } });
    // Queues real scraping jobs — just mark last_synced_at for now
    const now = new Date();
    await Promise.all(sources.map((s) => this.repo.update(s.id, { lastSyncedAt: now })));
    return { synced: sources.length, message: `Triggered sync for ${sources.length} sources` };
  }

  async getStats() {
    const [total, active, error, paused] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { status: NewsSourceStatus.ACTIVE } }),
      this.repo.count({ where: { status: NewsSourceStatus.ERROR } }),
      this.repo.count({ where: { status: NewsSourceStatus.PAUSED } }),
    ]);
    return { total, active, error, paused };
  }

  async filterByType(type: NewsSourceType) {
    return this.repo.find({ where: { type }, order: { priority: 'DESC' } });
  }
}
