import { Controller, Get, Post, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/guests/create-guest.dto';
import { QueryGuestDto } from './dto/guests/query-guest.dto';

@Controller('v1/events')
export class GuestsController {
  constructor(private readonly service: GuestsService) {}

  /** D-01. Kiểm tra trùng khách mời (realtime) */
  @Get(':eventId/guests/check-duplicate')
  checkDuplicate(
    @Param('eventId') eventId: string,
    @Query('phone') phone?: string,
    @Query('email') email?: string,
  ) {
    return this.service.checkDuplicate(eventId, phone, email);
  }

  /** D-04. Lấy tổng hợp tất cả khách mời của sự kiện */
  @Get(':eventId/guests')
  findAllByEvent(@Param('eventId') eventId: string, @Query() query: QueryGuestDto) {
    return this.service.findAllByEvent(eventId, query);
  }

  /** D-05. Hủy đăng ký khách mời */
  @Delete(':eventId/guests/registrations/:registrationId')
  cancelRegistration(
    @Param('eventId') eventId: string,
    @Param('registrationId') registrationId: string,
  ) {
    return this.service.cancelRegistration(eventId, registrationId);
  }

  /** D-02. Đăng ký khách mới cho phòng ban */
  @Post(':eventId/departments/:departmentId/guests')
  registerGuest(
    @Param('eventId') eventId: string,
    @Param('departmentId') departmentId: string,
    @Body() dto: CreateGuestDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.service.registerGuest(eventId, departmentId, dto, userId);
  }

  /** D-03. Lấy danh sách khách mời của phòng ban trong sự kiện */
  @Get(':eventId/departments/:departmentId/guests')
  findByDepartment(
    @Param('eventId') eventId: string,
    @Param('departmentId') departmentId: string,
    @Query() query: QueryGuestDto,
  ) {
    return this.service.findByDepartment(eventId, departmentId, query);
  }
}
