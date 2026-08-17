import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { QueryAnnouncementDto } from './dto/query-announcement.dto';

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return Boolean(value);
};

@Controller('announcements')
export class AdminAnnouncementsController {
  constructor(private readonly service: AnnouncementsService) { }

  @Post()
  create(@Request() req: any, @Body() dto: CreateAnnouncementDto) {
    const userId = req.user?.id || req.user?.userId || 'demo-admin-id';
    return this.service.create(userId, dto);
  }

  @Get()
  findAll(@Query() query: QueryAnnouncementDto) {
    return this.service.findAllAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId || 'demo-admin-id';
    return this.service.findOne(id, userId, true);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CreateAnnouncementDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Get(':id/statistics')
  getStatistics(@Param('id') id: string) {
    return this.service.getStatistics(id);
  }

  @Get(':id/read-status')
  getReadStatus(@Param('id') id: string) {
    return this.service.getReadStatusDetails(id);
  }

  @Post(':id/remind')
  remind(@Param('id') id: string) {
    return this.service.sendReminders(id);
  }

  @Patch(':id/pin')
  pin(@Param('id') id: string, @Body('is_pinned') isPinned: unknown) {
    return this.service.togglePin(id, toBoolean(isPinned));
  }

  @Patch(':id/comment')
  comment(@Param('id') id: string, @Body('allow_comment') allowComment: unknown) {
    return this.service.toggleComment(id, toBoolean(allowComment));
  }
}
