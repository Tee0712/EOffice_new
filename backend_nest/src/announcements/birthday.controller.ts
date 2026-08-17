import { Body, Controller, Get, Param, Post, Query, Request } from '@nestjs/common';
import { BirthdayService } from './birthday.service';

@Controller('birthday-cbnv')
export class BirthdayController {
  constructor(private readonly birthdayService: BirthdayService) {}

  @Get()
  list(
    @Query('view') view: string,
    @Query('date') date: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    const currentUserId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.birthdayService.list(
      {
        view,
        date,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      },
      currentUserId,
    );
  }

  @Post(':userId/wishes')
  sendWish(@Param('userId') userId: string, @Body() payload: { message?: string; subject?: string }, @Request() req: any) {
    const currentUserId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.birthdayService.sendWish(userId, payload, currentUserId);
  }
}
