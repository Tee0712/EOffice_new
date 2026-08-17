import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleProcessingEntity } from '../entities/article-processing.entity';
import { ArticleEntity, ArticleStatus } from '../entities/article.entity';
import { CreateArticleProcessingDto, ForwardArticleDto } from '../dto/media.dto';

@Injectable()
export class ArticleProcessingService {
  constructor(
    @InjectRepository(ArticleProcessingEntity, 'mssqlConnection')
    private readonly processingRepo: Repository<ArticleProcessingEntity>,
    @InjectRepository(ArticleEntity, 'mssqlConnection')
    private readonly articleRepo: Repository<ArticleEntity>,
  ) {}

  async getProcessing(articleId: string): Promise<ArticleProcessingEntity | null> {
    return this.processingRepo.findOne({ where: { articleId } });
  }

  async upsertProcessing(
    articleId: string,
    userId: string,
    dto: CreateArticleProcessingDto,
  ): Promise<ArticleProcessingEntity> {
    let processing = await this.processingRepo.findOne({ where: { articleId } });

    if (processing) {
      Object.assign(processing, dto, { processedBy: userId, processedAt: new Date() });
      return this.processingRepo.save(processing);
    }

    processing = this.processingRepo.create({
      articleId,
      processedBy: userId,
      processedAt: new Date(),
      ...dto,
    });
    return this.processingRepo.save(processing);
  }

  async updateStatus(articleId: string, status: ArticleStatus): Promise<ArticleEntity> {
    const article = await this.articleRepo.findOne({ where: { id: articleId } });
    if (!article) throw new NotFoundException(`Article ${articleId} not found`);
    article.status = status;
    return this.articleRepo.save(article);
  }

  async forward(articleId: string, dto: ForwardArticleDto, userId: string): Promise<ArticleProcessingEntity> {
    let processing = await this.processingRepo.findOne({ where: { articleId } });

    if (!processing) {
      processing = this.processingRepo.create({ articleId, processedBy: userId });
    }
    processing.forwardedDepartments = JSON.stringify(dto.departmentIds);
    processing.processedBy = userId;
    processing.processedAt = new Date();
    await this.processingRepo.save(processing);

    // Auto-update article status to can_theo_doi
    await this.articleRepo.update(articleId, { status: ArticleStatus.CAN_THEO_DOI });
    return processing;
  }

  async escalate(articleId: string, userId: string): Promise<ArticleProcessingEntity> {
    let processing = await this.processingRepo.findOne({ where: { articleId } });

    if (!processing) {
      processing = this.processingRepo.create({ articleId, processedBy: userId });
    }
    processing.escalated = true;
    processing.processedBy = userId;
    processing.processedAt = new Date();
    return this.processingRepo.save(processing);
  }
}
