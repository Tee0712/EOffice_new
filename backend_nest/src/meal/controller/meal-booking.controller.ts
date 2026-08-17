import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/oauth/jwt.guard';
import { MealBookingService } from '../service/meal-booking.service';
import { MealService } from '../meal.service';
import { SystemLogServiceSql } from 'src/systemLogManagement/system-log-service-sql';
import { ZodValidationPipe } from '../zod-validation.pipe';
import {
  RegisterMealSchema,
  RegisterMealDto,
  BulkRegisterSchema,
  BulkRegisterDto,
  CancelRegistrationSchema,
  CancelRegistrationDto,
  UpdateRegistrationSchema,
  UpdateRegistrationDto,
  DashboardFilterSchema,
  DashboardFilterDto,
} from '../dto';

@ApiTags('🍽️ Meal - Đăng ký suất ăn')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/meals')
export class MealBookingController {
  constructor(
    private readonly registrationService: MealBookingService,
    private readonly mealService: MealService,
    private readonly systemLogService: SystemLogServiceSql,
  ) {}

  // GET /api/v1/canteen/calendar?start_date=...&end_date=...
  @Get('calendar')
  @ApiOperation({ summary: '1.1 Lấy lịch đăng ký ăn ca theo tuần/tháng' })
  async getCalendar(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Req() req: any,
  ) {
    const data = await this.registrationService.getCalendar(req.user.userId, startDate, endDate);
    return { success: true, data };
  }

  // POST /api/v1/canteen/register
  @Post('register')
  @ApiOperation({ summary: '1.2 Đăng ký suất ăn đơn lẻ (nhiều ca trong ngày)' })
  async register(
    @Body(new ZodValidationPipe(RegisterMealSchema)) body: RegisterMealDto,
    @Req() req: any,
  ) {
    const data = await this.registrationService.register(req.user.userId, body);
    return { success: true, data };
  }

  // POST /api/v1/canteen/bulk-register
  @Post('bulk-register')
  @ApiOperation({ summary: '1.3 Đăng ký suất ăn hàng loạt (nhiều ngày)' })
  async bulkRegister(
    @Body(new ZodValidationPipe(BulkRegisterSchema)) body: BulkRegisterDto,
    @Req() req: any,
  ) {
    const data = await this.registrationService.bulkRegister(req.user.userId, body);
    return { success: true, data };
  }

  // PATCH /api/v1/canteen/registrations/:id
  @Patch('registrations/:id')
  @ApiOperation({ summary: '1.4 Chỉnh sửa đăng ký (thêm/bớt ca ăn)' })
  async updateRegistration(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateRegistrationSchema)) body: UpdateRegistrationDto,
    @Req() req: any,
  ) {
    const data = await this.registrationService.updateRegistration(req.user.userId, id, body);
    return { success: true, data };
  }

  @Get('suppliers-dashboard/summary')
  @ApiOperation({ summary: 'Lấy thống kê tổng quát nhà cung cấp (Dashboard)' })
  async getDashboardSummary(@Query(new ZodValidationPipe(DashboardFilterSchema)) query: DashboardFilterDto) {
    const data = await this.mealService.getSuppliersDashboardSummary(query);
    return { success: true, data };
  }

  // PATCH /api/v1/canteen/registrations/:id/cancel
  @Patch('registrations/:id/cancel')
  @ApiOperation({ summary: '1.5 Hủy đăng ký suất ăn' })
  async cancelRegistration(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(CancelRegistrationSchema)) body: CancelRegistrationDto,
    @Req() req: any,
  ) {
    const data = await this.registrationService.cancelRegistration(req.user.userId, id, body);
    return { success: true, data };
  }

  // GET /api/v1/canteen/my-registrations
  @Get('my-registrations')
  @ApiOperation({ summary: '2.1 Danh sách lịch sử đăng ký (cá nhân)' })
  async getMyRegistrations(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Req() req: any,
  ) {
    const data = await this.registrationService.getMyRegistrations(req.user.userId, {
      page: Number(page),
      limit: Number(limit),
      status,
      start_date: startDate,
      end_date: endDate,
    });
    return { success: true, data };
  }

  // GET /api/v1/canteen/my-stats
  @Get('my-stats')
  @ApiOperation({ summary: '2.2 Thống kê đăng ký ăn ca cá nhân' })
  async getMyStats(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Req() req: any,
  ) {
    const data = await this.registrationService.getMyStats(req.user.userId, startDate, endDate);
    return { success: true, data };
  }

  // GET /api/v1/canteen/my-registration-logs
  @Get('my-registration-logs')
  @ApiOperation({ summary: '2.3 Lịch sử thao tác đăng ký ăn ca của tôi' })
  async getMyRegistrationLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('registration_id') registrationId?: number,
    @Req() req?: any,
  ) {
    const data = await this.registrationService.getMyRegistrationLogs(req.user.userId, {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      start_date: startDate,
      end_date: endDate,
      registration_id: registrationId ? Number(registrationId) : undefined,
    });
    return { success: true, data };
  }

  @Get('admin/registration-logs')
  @ApiOperation({ summary: 'Lịch sử thao tác hệ thống canteen (Admin) - SRS v2' })
  async getAdminRegistrationLogs(@Query() query: any) {
    const data = await this.systemLogService.findAll({
      ...query,
      type: 'CANTEEN',
    });
    return { success: true, ...data };
  }
}
