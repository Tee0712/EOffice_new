import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Query,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/oauth/jwt.guard';
import { MealAdminService } from '../service/meal-admin.service';
import { MealBookingService } from '../service/meal-booking.service';
import { MealService } from '../meal.service';
import { SystemLogServiceSql } from 'src/systemLogManagement/system-log-service-sql';
import { ZodValidationPipe } from '../zod-validation.pipe';
import {
  CreateMealSessionSchema,
  CreateMealSessionDto,
  UpdateMealSessionSchema,
  UpdateMealSessionDto,
  CreateDailyMenuSchema,
  CreateDailyMenuDto,
  UpdateDailyMenuSchema,
  UpdateDailyMenuDto,
  CreateMealTemplateSchema,
  CreateMealTemplateDto,
  UpdateSystemSettingSchema,
  UpdateSystemSettingDto,
  UpdateUserSettingSchema,
  UpdateUserSettingDto,
} from '../dto';

@ApiTags('🔧 Meal Admin - Quản trị bếp ăn')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/meals/admin')
export class MealAdminController {
  constructor(
    private readonly adminService: MealAdminService,
    private readonly registrationService: MealBookingService,
    private readonly mealService: MealService,
    private readonly systemLogService: SystemLogServiceSql,
  ) {}

  // ─── Meal Sessions ───────────────────────────────────────────────────────────

  @Get('sessions')
  @ApiOperation({ summary: 'A1. Lấy danh sách ca ăn' })
  async getSessions() {
    const data = await this.adminService.getAllSessions();
    return { success: true, data };
  }

  @Post('sessions')
  @ApiOperation({ summary: 'A2. Tạo ca ăn mới' })
  async createSession(
    @Body(new ZodValidationPipe(CreateMealSessionSchema)) body: CreateMealSessionDto,
  ) {
    const data = await this.adminService.createSession(body);
    return { success: true, data };
  }

  @Put('sessions/:id')
  @ApiOperation({ summary: 'A3. Cập nhật ca ăn' })
  async updateSession(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateMealSessionSchema)) body: UpdateMealSessionDto,
  ) {
    const data = await this.adminService.updateSession(id, body);
    return { success: true, data };
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'A4. Xóa ca ăn' })
  async deleteSession(@Param('id', ParseIntPipe) id: number) {
    const data = await this.adminService.deleteSession(id);
    return { success: true, data };
  }

  // ─── Daily Menus ─────────────────────────────────────────────────────────────

  @Get('menus')
  @ApiOperation({ summary: 'B1. Lấy danh sách menu hàng ngày' })
  async getMenus(
    @Query('date') date: string,
    @Query('meal_session_id') mealSessionId: number,
  ) {
    const data = await this.adminService.getDailyMenus(date, mealSessionId);
    return { success: true, data };
  }

  @Get('menus/:id')
  @ApiOperation({ summary: 'B2. Lấy chi tiết menu' })
  async getMenuById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.adminService.getDailyMenuById(id);
    return { success: true, data };
  }

  @Post('menus')
  @ApiOperation({ summary: 'B3. Tạo menu mới cho ca ăn trong ngày' })
  async createMenu(
    @Body(new ZodValidationPipe(CreateDailyMenuSchema)) body: CreateDailyMenuDto,
    @Req() req: any,
  ) {
    const data = await this.adminService.createDailyMenu(body, req.user.userId);
    return { success: true, data };
  }

  @Put('menus/:id')
  @ApiOperation({ summary: 'B4. Cập nhật menu' })
  async updateMenu(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateDailyMenuSchema)) body: UpdateDailyMenuDto,
  ) {
    const data = await this.adminService.updateDailyMenu(id, body);
    return { success: true, data };
  }

  @Patch('menus/:id/toggle')
  @ApiOperation({ summary: 'B5. Bật/tắt ca ăn trong ngày (is_active)' })
  async toggleMenu(@Param('id', ParseIntPipe) id: number) {
    const menu = await this.adminService.getDailyMenuById(id);
    const data = await this.adminService.updateDailyMenu(id, { is_active: !menu.isActive });
    return { success: true, data };
  }

  @Delete('menus/:id')
  @ApiOperation({ summary: 'B6. Xóa menu' })
  async deleteMenu(@Param('id', ParseIntPipe) id: number) {
    const data = await this.adminService.deleteDailyMenu(id);
    return { success: true, data };
  }

  // ─── Meal Templates ──────────────────────────────────────────────────────────

  @Get('templates')
  @ApiOperation({ summary: 'C1. Lấy danh sách template đăng ký nhanh' })
  async getTemplates(@Req() req: any) {
    const data = await this.adminService.getTemplates(req.user.userId);
    return { success: true, data };
  }

  @Post('templates')
  @ApiOperation({ summary: 'C2. Tạo template mới' })
  async createTemplate(
    @Body(new ZodValidationPipe(CreateMealTemplateSchema)) body: CreateMealTemplateDto,
    @Req() req: any,
  ) {
    const data = await this.adminService.createTemplate(body, req.user.userId);
    return { success: true, data };
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'C3. Xóa template' })
  async deleteTemplate(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    // TODO: add role check for admin
    const data = await this.adminService.deleteTemplate(id, req.user.userId, false);
    return { success: true, data };
  }

  // ─── System Settings ─────────────────────────────────────────────────────────

  @Get('settings')
  @ApiOperation({ summary: 'D1. Lấy cài đặt hệ thống bếp ăn' })
  async getSettings() {
    const data = await this.adminService.getSystemSettings();
    return { success: true, data };
  }

  @Patch('settings')
  @ApiOperation({ summary: 'D2. Cập nhật cài đặt hệ thống' })
  async updateSettings(
    @Body(new ZodValidationPipe(UpdateSystemSettingSchema)) body: UpdateSystemSettingDto,
    @Req() req: any,
  ) {
    const data = await this.adminService.updateSystemSettings(body, req.user.userId);
    return { success: true, data };
  }

  // ─── User Settings ───────────────────────────────────────────────────────────

  @Get('user-settings')
  @ApiOperation({ summary: 'E1. Lấy cài đặt cá nhân' })
  async getUserSettings(@Req() req: any) {
    const data = await this.adminService.getUserSettings(req.user.userId);
    return { success: true, data };
  }

  @Patch('user-settings')
  @ApiOperation({ summary: 'E2. Cập nhật cài đặt cá nhân' })
  async updateUserSettings(
    @Body(new ZodValidationPipe(UpdateUserSettingSchema)) body: UpdateUserSettingDto,
    @Req() req: any,
  ) {
    const data = await this.adminService.updateUserSettings(req.user.userId, body);
    return { success: true, data };
  }

  // ─── Admin Registration Queries ──────────────────────────────────────────────────────────────

  @Get('registrations')
  @ApiOperation({ summary: 'F1. Danh sách đăng ký suất ăn (Admin) - date optional, không có date = lấy tất cả' })
  async getAdminRegistrations(
    @Query('date') date?: string,
    @Query('dept') dept?: string,
    @Query('slot') slot?: string,
    @Query('q') q?: string,
  ) {
    const data = await this.registrationService.getAdminRegistrations({ date, dept, slot, q });
    if (Array.isArray(data) && data.length > 0) {
      return { success: true, data };
    }

    const targetDate = date || new Date().toISOString().slice(0, 10);
    const legacy = await this.mealService.findAllRegistrations({ date: targetDate, dept, slot, q } as any);
    const normalized = (legacy || []).map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      user_name: r.user?.name || r.user_id,
      email: r.user?.email || '',
      department_id: r.user?.organization_code || '',
      department_name: r.user?.organization_name || '',
      date: r.menu?.menu_date || targetDate,
      status: r.status || 'registered',
      note: null,
      cancel_reason: r.cancel_reason || null,
      total_cost: Number(r.menu?.price_total_planned || 0),
      menu: {
        meal_slot: r.menu?.meal_slot || null,
        meal_name: r.menu_item?.dish?.name || r.menu?.title_manual || '',
      },
      meals: [
        {
          meal_session_id: null,
          meal_name: r.menu_item?.dish?.name || r.menu?.title_manual || '',
          slot: r.menu?.meal_slot || null,
          dish_name: r.menu_item?.dish?.name || r.menu?.title_manual || '',
          price: Number(r.menu?.price_total_planned || 0),
        },
      ],
    }));
    return { success: true, data: normalized };
  }

  @Get('registrations/summary')
  @ApiOperation({ summary: 'F2. Thống kê đăng ký suất ăn theo ngày (Admin)' })
  async getAdminRegistrationsSummary(@Query('date') date?: string) {
    const data = await this.registrationService.getAdminSummary(date);
    if ((data?.total || 0) > 0) {
      return { success: true, data };
    }
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const legacy = await this.mealService.getDailySummary(targetDate);
    return { success: true, data: legacy };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'F3. Dashboard tổng hợp suất ăn (Admin)' })
  async getAdminDashboard(
    @Query('date') date?: string,
    @Query('view') view: 'day' | 'week' | 'month' = 'day',
  ) {
    const data = await this.registrationService.getAdminDashboard({ date, view });
    return { success: true, data };
  }
}
