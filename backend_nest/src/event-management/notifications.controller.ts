import { Controller, Get, Post, Patch, Body, Param, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/notifications/create-notification.dto';
import { RemindNotificationDto } from './dto/notifications/remind-notification.dto';

@Controller('v1')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  /** B-01. Tạo và gửi thông báo */
  @Post('events/:eventId/notifications')
  createAndSend(
    @Param('eventId') eventId: string,
    @Body() dto: CreateNotificationDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId || 'system';
    return this.service.createAndSend(eventId, dto, userId);
  }

  /** B-02. Lấy danh sách thông báo của sự kiện */
  @Get('events/:eventId/notifications')
  findByEvent(@Param('eventId') eventId: string) {
    return this.service.findByEvent(eventId);
  }

  /** B-03. Chi tiết thông báo */
  @Get('notifications/:notificationId')
  findOne(@Param('notificationId') id: string) {
    return this.service.findOne(id);
  }

  /** B-04. Thu hồi thông báo */
  @Patch('notifications/:notificationId/recall')
  recall(@Param('notificationId') id: string) {
    return this.service.recall(id);
  }

  /** B-05. Gửi lại thông báo nhắc nhở */
  @Post('notifications/:notificationId/remind')
  sendReminder(@Param('notificationId') id: string, @Body() dto: RemindNotificationDto) {
    return this.service.sendReminder(id, dto);
  }
}
