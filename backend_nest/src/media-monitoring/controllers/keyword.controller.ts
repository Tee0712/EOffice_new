import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query,
} from '@nestjs/common';
import { KeywordService } from '../services/keyword.service';
import { CreateKeywordDto, UpdateKeywordDto, QueryKeywordDto, ReorderKeywordDto } from '../dto/media.dto';

@Controller('media/keywords')
export class KeywordController {
  constructor(private readonly service: KeywordService) {}

  @Post()
  create(@Body() dto: CreateKeywordDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryKeywordDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/matched-articles')
  getMatchedArticles(@Param('id') id: string) {
    return this.service.getMatchedArticles(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateKeywordDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.service.toggle(id, isActive);
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderKeywordDto) {
    return this.service.reorder(dto);
  }
}
