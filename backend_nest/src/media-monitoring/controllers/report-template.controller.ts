import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query,
} from '@nestjs/common';
import { ReportTemplateService } from '../services/report-template.service';
import { CreateReportTemplateDto, UpdateReportTemplateDto, QueryReportTemplateDto } from '../dto/media.dto';

@Controller('media/reports')
export class ReportTemplateController {
  constructor(private readonly service: ReportTemplateService) {}

  @Post()
  create(@Body() dto: CreateReportTemplateDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryReportTemplateDto) {
    return this.service.findAll(query);
  }

  @Get('history')
  getHistory(
    @Query('templateId') templateId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.service.getHistory(templateId, parseInt(page) || 1, parseInt(limit) || 20);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReportTemplateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.service.duplicate(id);
  }

  @Post(':id/send')
  send(@Param('id') id: string) {
    return this.service.send(id);
  }

  @Post('history/:historyId/resend')
  resend(@Param('historyId') historyId: string) {
    return this.service.resend(historyId);
  }
}
