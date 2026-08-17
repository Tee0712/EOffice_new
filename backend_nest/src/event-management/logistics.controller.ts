import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { CreateLogisticsDto } from './dto/logistics/create-logistics.dto';
import { CreateHotelDto } from './dto/logistics/create-hotel.dto';
import { CreateTransportDto } from './dto/logistics/create-transport.dto';
import { CreateCateringDto } from './dto/logistics/create-catering.dto';
import { LogisticsStatus } from './entities/event-logistics.entity';

@Controller('v1')
export class LogisticsController {
  constructor(private readonly service: LogisticsService) {}

  /** F-01. Tạo yêu cầu hậu cần */
  @Post('events/:eventId/logistics')
  create(@Param('eventId') eventId: string, @Body() dto: CreateLogisticsDto) {
    return this.service.create(eventId, dto);
  }

  /** F-02. Lấy danh sách hậu cần của sự kiện */
  @Get('events/:eventId/logistics')
  findByEvent(@Param('eventId') eventId: string) {
    return this.service.findByEvent(eventId);
  }

  /** F-03. Thêm đặt phòng khách sạn */
  @Post('logistics/:logisticsId/hotels')
  addHotel(@Param('logisticsId') logisticsId: string, @Body() dto: CreateHotelDto) {
    return this.service.addHotel(logisticsId, dto);
  }

  /** F-04. Thêm đặt xe */
  @Post('logistics/:logisticsId/transports')
  addTransport(@Param('logisticsId') logisticsId: string, @Body() dto: CreateTransportDto) {
    return this.service.addTransport(logisticsId, dto);
  }

  /** F-05. Thêm kế hoạch ăn uống */
  @Post('logistics/:logisticsId/caterings')
  addCatering(@Param('logisticsId') logisticsId: string, @Body() dto: CreateCateringDto) {
    return this.service.addCatering(logisticsId, dto);
  }

  /** F-06. Cập nhật trạng thái hậu cần */
  @Patch('logistics/:logisticsId/status')
  updateStatus(@Param('logisticsId') logisticsId: string, @Body('status') status: LogisticsStatus) {
    return this.service.updateStatus(logisticsId, status);
  }
}
