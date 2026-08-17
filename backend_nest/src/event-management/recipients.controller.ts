import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { ConfirmationsService } from './confirmations.service';
import { ConfirmRecipientDto } from './dto/confirmations/confirm-recipient.dto';

@Controller('v1/recipients')
export class RecipientsController {
  constructor(private readonly service: ConfirmationsService) {}

  /** C-01. Phòng ban xác nhận tham dự */
  @Post(':recipientId/confirm')
  confirm(
    @Param('recipientId') recipientId: string,
    @Body() dto: ConfirmRecipientDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId || 'system';
    return this.service.confirm(recipientId, dto, userId);
  }

  /** C-02. Lấy trạng thái xác nhận của phòng ban */
  @Get(':recipientId/confirmation')
  getConfirmation(@Param('recipientId') recipientId: string) {
    return this.service.getConfirmation(recipientId);
  }

  /** C-03. Lịch sử nhắc nhở của phòng ban */
  @Get(':recipientId/reminders')
  getReminders(@Param('recipientId') recipientId: string) {
    return this.service.getReminders(recipientId);
  }
}
