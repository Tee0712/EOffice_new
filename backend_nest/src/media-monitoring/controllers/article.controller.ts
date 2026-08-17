import {
  Controller, Get, Post, Patch, Param, Query, Body, Request,
} from '@nestjs/common';
import { ArticleService } from '../services/article.service';
import { ArticleProcessingService } from '../services/article-processing.service';
import {
  QueryArticleDto, UpdateArticleStatusDto, BatchUpdateArticleDto,
  CreateArticleProcessingDto, ForwardArticleDto,
} from '../dto/media.dto';
import { ArticleStatus } from '../entities/article.entity';

@Controller('media/articles')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly processingService: ArticleProcessingService,
  ) {}

  @Get()
  findAll(@Query() query: QueryArticleDto) {
    return this.articleService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.articleService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articleService.findOne(id);
  }

  @Get(':id/neighbors')
  getNeighbors(@Param('id') id: string) {
    return this.articleService.getNeighbors(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateArticleStatusDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId || 'system';
    return this.articleService.updateStatus(id, dto, userId);
  }

  @Patch('batch-status')
  batchUpdateStatus(@Body() dto: BatchUpdateArticleDto) {
    return this.articleService.batchUpdateStatus(dto);
  }

  // --- Processing sub-resource ---

  @Get(':id/processing')
  getProcessing(@Param('id') id: string) {
    return this.processingService.getProcessing(id);
  }

  @Post(':id/processing')
  upsertProcessing(
    @Param('id') id: string,
    @Body() dto: CreateArticleProcessingDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId || 'system';
    return this.processingService.upsertProcessing(id, userId, dto);
  }

  @Patch(':id/processing')
  updateProcessing(
    @Param('id') id: string,
    @Body() dto: CreateArticleProcessingDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId || 'system';
    return this.processingService.upsertProcessing(id, userId, dto);
  }

  @Post(':id/forward')
  forward(
    @Param('id') id: string,
    @Body() dto: ForwardArticleDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId || 'system';
    return this.processingService.forward(id, dto, userId);
  }

  @Post(':id/escalate')
  escalate(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId || 'system';
    return this.processingService.escalate(id, userId);
  }

  @Patch(':id/mark-processing')
  markProcessing(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId || 'system';
    return this.processingService.updateStatus(id, ArticleStatus.DA_XU_LY);
  }
}
