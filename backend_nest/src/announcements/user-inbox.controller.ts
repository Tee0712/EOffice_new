import { Controller, Get, Param, Patch, Query, Request } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { QueryInboxDto } from './dto/query-announcement.dto';

@Controller('user/inbox')
export class UserInboxController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get()
  findAll(@Request() req: any, @Query() query: QueryInboxDto) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.service.findAllUser(userId, query);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req: any) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.service.getUnreadCount(userId);
  }

  @Patch('mark-all-read')
  markAllRead(@Request() req: any) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.service.markAllAsRead(userId);
  }

  @Get('statistics')
  getStatistics(@Request() req: any) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.service.getInboxStatistics(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.service.findOne(id, userId, false);
  }

  @Get(':id/neighbors')
  getNeighbors(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.service.getNeighbors(id, userId);
  }

  @Patch(':id/confirm')
  confirmRead(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.service.confirmRead(id, userId);
  }
}
