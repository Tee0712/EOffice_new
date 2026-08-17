import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query,
} from '@nestjs/common';
import { AlertRuleService } from '../services/alert-rule.service';
import { CreateAlertRuleDto, UpdateAlertRuleDto, QueryAlertRuleDto } from '../dto/media.dto';

@Controller('media/alert-rules')
export class AlertRuleController {
  constructor(private readonly service: AlertRuleService) {}

  @Post()
  create(@Body() dto: CreateAlertRuleDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryAlertRuleDto) {
    return this.service.findAll(query);
  }

  @Get('events')
  getEvents(
    @Query('alertRuleId') alertRuleId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.service.getEvents(alertRuleId, parseInt(page) || 1, parseInt(limit) || 20);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAlertRuleDto) {
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

  @Patch('events/:eventId/resolve')
  resolveEvent(@Param('eventId') eventId: string) {
    return this.service.resolveEvent(eventId);
  }
}
