import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Request,
} from '@nestjs/common';
import { NewsSourceService } from '../services/news-source.service';
import { CreateNewsSourceDto, UpdateNewsSourceDto, QueryNewsSourceDto } from '../dto/media.dto';

@Controller('media/news-sources')
export class NewsSourceController {
  constructor(private readonly service: NewsSourceService) {}

  @Post()
  create(@Body() dto: CreateNewsSourceDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryNewsSourceDto) {
    return this.service.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNewsSourceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string, @Body('isEnabled') isEnabled: boolean) {
    return this.service.toggle(id, isEnabled);
  }

  @Post('sync-all')
  syncAll() {
    return this.service.syncAll();
  }
}
