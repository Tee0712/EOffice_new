import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  Param,
  BadRequestException,
  Delete,
  Patch,
  HttpException,
  ParseIntPipe,
  Put,
  UploadedFiles,
  UseInterceptors,
  Res,
} from '@nestjs/common';

import { CanteenService } from './canteen.service';
import { CanteenAdminService } from './service/canteen-admin.service';
import {
  CreateWeeklyMenuDto, CreateWeeklyMenuSchema,
  CreateTemplateDto, CreateTemplateSchema,
  ApplyTemplateDto, ApplyTemplateSchema,
  RegisterMealSchema, RegisterMealDto,
  BulkRegisterSchema, BulkRegisterDto,
  CancelRegistrationSchema, CancelRegistrationDto,
  UpdateRegistrationSchema, UpdateRegistrationDto,
  DailyMenuSchema, DailyMenuDto,
  UpdateMenuStatusSchema, UpdateMenuStatusDto,
  CopyDailyMenuSchema, CopyDailyMenuDto,
  CheckInSchema, CheckInDto,
  ActualServingSchema, ActualServingDto,
  SupplierContractSchema, SupplierContractDto,
  SupplierOrderSchema, SupplierOrderDto,
  SupplierEvaluationSchema, SupplierEvaluationDto,
  WeeklyMenuSaveDto, WeeklyMenuSaveSchema,
  DashboardFilterSchema, DashboardFilterDto,
  DailyMenuSetupSaveDto, DailyMenuSetupSaveSchema,
  StartDateQuerySchema, StartDateQueryDto,
  DateQuerySchema, DateQueryDto,
} from './dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { ZodValidationPipe } from './zod-validation.pipe';
import { SystemLogServiceSql } from 'src/systemLogManagement/system-log-service-sql';
import { JwtAuthGuard } from 'src/oauth/jwt.guard';
import { Public } from 'src/oauth/decorator/public.decorator';
import { Request, Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as moment from 'moment';
import { CanteenEvaluationAccessGuard } from './guard/canteen-evaluation-access.guard';




@ApiTags('Canteen - Meal Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1')
export class CanteenController {
  constructor(
    private readonly canteenService: CanteenService,
    private readonly canteenAdminService: CanteenAdminService,
    private readonly systemLogService: SystemLogServiceSql,
  ) { }

  // --- System Settings ---

  /**
   * @swagger
   * /api/v1/settings:
   *   get:
   *     summary: Lấy toàn bộ cài đặt hệ thống Canteen
   *     tags: [Canteen]
   */
  @ApiOperation({ summary: 'Lấy toàn bộ cài đặt hệ thống Canteen' })
  @Get('meal-settings')
  async getAllSettings() {
    const data = await this.canteenService.getSettings();
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/meal-settings/bulk:
   *   post:
   *     summary: Cập nhật hàng loạt cài đặt hệ thống
   *     tags: [Canteen]
   */
  @ApiOperation({ summary: 'Cập nhật hàng loạt cài đặt hệ thống' })
  @Post('meal-settings/bulk')
  async updateSettingsBulk(@Body() settings: any[], @Req() req: Request) {
    const userId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.updateSettings(settings);
    await this.trackAction(req, 'POST', `Cập nhật hàng loạt ${settings.length} cài đặt`, 'SETTINGS_UPDATE');
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Xuất Excel thực đơn ngày' })
  @Get('menus/daily-export-excel')
  async exportDailyMenuExcel(@Query('date') date: string, @Res() res: Response) {
    const file = await this.canteenService.exportDailyMenuExcel(date);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    return res.send(file.buffer);
  }

  @ApiOperation({ summary: 'Lấy dữ liệu in thực đơn ngày' })
  @Get('menus/daily-print-data')
  async getDailyMenuPrintData(@Query('date') date: string) {
    const data = await this.canteenService.getDailyMenuPrintData(date);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Thống kê đăng ký theo phòng ban' })
  @Get('registrations/department-summary')
  async getDepartmentRegistrationSummary(@Query('date') date: string) {
    const data = await this.canteenService.getDepartmentRegistrationSummary(date);
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/menus/sync-db:
   *   get:
   *     summary: Đồng bộ cấu trúc CSDL Canteen
   *     tags: [Canteen]
   */
  @Public()
  @Get('menus/sync-db')
  @ApiOperation({ summary: 'Trình kích hoạt đồng bộ CSDL thủ công' })
  async syncDb(@Req() req: Request) {
    await this.canteenService.onModuleInit();
    await this.trackAction(req, 'GET', 'Kích hoạt đồng bộ CSDL Canteen', 'DB_SYNC');
    return { success: true, message: 'Database sync triggered. Check logs.' };
  }

  /**
   * @swagger
   * /api/v1/dishes:
   *   get:
   *     summary: Lấy danh mục món ăn
   *     tags: [Canteen]
   */
  @ApiOperation({ summary: 'Lấy các món ăn đang hoạt động' })
  @Get('dishes')
  async getDishes() {
    const data = await this.canteenService.findAllDishes();
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/suppliers:
   *   get:
   *     summary: Lấy danh sách nhà cung cấp
   *     tags: [Canteen]
   */
  @ApiOperation({ summary: 'Lấy danh sách nhà cung cấp' })
  @Get('suppliers')
  async getSuppliers(@Query() query: any) {
    const data = await this.canteenService.findAllSuppliers(query);
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/suppliers/dashboard/overview:
   *   get:
   *     summary: Lấy thống kê tổng quan nhà cung cấp (Dashboard)
   *     tags: [Canteen]
   */

  @ApiOperation({ summary: 'Lấy thống kê tổng quan nhà cung cấp' })
  @Get('suppliers/dashboard/overview')
  async getSuppliersOverview() {
    const data = await this.canteenService.getSuppliersOverview();
    return { success: true, data };
  }


  @ApiOperation({ summary: 'Lấy chi tiết nhà cung cấp (Header & Metrics)' })
  @Get('suppliers/item/:id')
  async getSupplierDetail(@Param('id', ParseIntPipe) id: number) {
    const data = await this.canteenService.getSupplierDetail(id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Lấy danh sách hợp đồng của nhà cung cấp' })
  @Get('suppliers/:id/contracts')
  async getSupplierContracts(@Param('id', ParseIntPipe) id: number) {
    const data = await this.canteenService.getSupplierContracts(id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Xuất Excel danh sách đánh giá nhà cung cấp' })
  @Get('supplier-evaluations/export-excel')
  async exportSupplierEvaluationsExcel(@Query() query: any, @Res() res: Response) {
    const { fileName, buffer } = await this.canteenService.exportSupplierEvaluationsExcel(query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Lấy dánh sách món của nhà cung cấp' })
  @Get('suppliers/:id/prices')
  async getSupplierPrices(@Param('id', ParseIntPipe) id: number) {
    const data = await this.canteenService.findAllDishesSupplier(id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Lấy danh sách món ăn chưa được đánh giá' })
  @Get('suppliers/:id/unevaluated-dishes')
  async getUnevaluatedDishes(
    @Param('id', ParseIntPipe) id: number,
    @Query('orderId') orderId?: string,
  ) {
    const data = await this.canteenService.getUnevaluatedDishes(id, orderId ? Number(orderId) : undefined);
    return { success: true, data };
  }


  @ApiOperation({ summary: 'Lấy lịch sử đơn hàng của nhà cung cấp' })
  @Get('suppliers/:id/orders')
  async getSupplierOrders(@Param('id', ParseIntPipe) id: number, @Query() query: any) {
    const data = await this.canteenService.getSupplierOrders(id, query);
    return { success: true, data };
  }



  /**
   * @swagger
   * /api/v1/menus/week:
   *   get:
   *     summary: Lấy thực đơn tuần
   *     tags: [Canteen]
   */
  @ApiOperation({ summary: 'Lấy thực đơn tuần (lịch tuần)' })
  @Get('menus/week')
  async getWeeklyMenu(@Query('week_start') weekStart: string) {
    const data = await this.canteenService.findWeeklyMenu(weekStart);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Lấy danh sách menu (hỗ trợ màn đánh giá bữa ăn)' })
  @Get('menus')
  async getMenus(
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('mealDate') mealDate?: string,
    @Query('mealTypeId') mealTypeId?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    const data = await this.canteenService.findMenusForReview({
      status,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      mealDate,
      mealTypeId: mealTypeId ? Number(mealTypeId) : undefined,
      supplierId: supplierId ? Number(supplierId) : undefined,
    });
    return { success: true, ...data };
  }

  @ApiOperation({ summary: 'Lấy thực đơn tuần (Phiên bản mới)' })
  @Get('menus/weekly')
  async getWeeklyMenuV2(@Query(new ZodValidationPipe(StartDateQuerySchema)) query: StartDateQueryDto) {
    const data = await this.canteenService.getWeeklyMenuV2(query.startDate);
    return data;
  }

  @ApiOperation({ summary: 'Lấy món ăn theo ngày' })
  @Get('menus/day-item')
  async getDailyMenuDetail(@Query(new ZodValidationPipe(DateQuerySchema)) query: DateQueryDto) {
    const data = await this.canteenService.getDailyMenuDetail(query.date);
    return data;
  }

  @ApiOperation({ summary: 'Lấy chi tiết menu theo ID (phục vụ màn đánh giá bữa ăn)' })
  @Get('menus/:id')
  async getMenuDetail(@Param('id') id: string) {
    const data = await this.canteenService.findMenuDetailForReview(Number(id));
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Lấy danh sách tùy chọn filter cho màn đánh giá bữa ăn' })
  @Get('meal-review-filters/options')
  async getMealReviewFilterOptions() {
    const data = await this.canteenService.getMealReviewFilterOptions();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Lấy danh sách tiêu chí đánh giá bữa ăn' })
  @Get('review-criteria')
  async getReviewCriteria(
    @Query('isActive') _isActive?: string,
    @Query('sortBy') _sortBy?: string,
    @Query('sortOrder') _sortOrder?: string,
  ) {
    const data = await this.canteenService.getMealReviewCriteria();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Tạo đánh giá bữa ăn' })
  @Post('meal-reviews')
  async createMealReview(@Body() dto: any, @Req() req: Request) {
    const userId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.createMealReview(userId, dto);
    return { success: true, data, message: 'Gửi đánh giá thành công.' };
  }

  @ApiOperation({ summary: 'Tạo phiếu đánh giá bữa ăn (alias cho FE cũ)' })
  @Post('meals/evaluations')
  async createMealEvaluationAlias(@Body() body: any, @Req() req: Request) {
    const userId = (req as any).user?.userId || 'System';
    const dto = body?.data || body || {};
    const scores = dto.scores || {};
    const payload = {
      menuId: dto.menuId ?? dto.menu_id,
      reviewDate: dto.reviewDate ?? dto.review_date ?? null,
      mealTypeId: dto.mealTypeId ?? dto.meal_type_id ?? null,
      supplierId: dto.supplierId ?? dto.supplier_id ?? null,
      tasteScore: dto.tasteScore ?? scores.taste ?? 0,
      hygieneScore: dto.hygieneScore ?? scores.hygiene ?? 0,
      portionScore: dto.portionScore ?? scores.portion ?? 0,
      varietyScore: dto.varietyScore ?? scores.variety ?? scores.diversity ?? 0,
      serviceScore: dto.serviceScore ?? scores.service ?? 0,
      commentText: dto.commentText ?? dto.comment ?? '',
    };
    const data = await this.canteenService.createMealReview(userId, payload);
    return { success: true, data, message: 'Gửi đánh giá thành công.' };
  }

  @ApiOperation({ summary: 'Lấy đánh giá hiện tại của tôi theo menu' })
  @Get('meal-reviews/my-current')
  async getMyCurrentReview(
    @Query('menuId') menuId: string,
    @Query('includeImages') includeImages?: string,
    @Query('includeReplies') includeReplies?: string,
    @Req() req?: Request,
  ) {
    const userId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.getMyCurrentReview(userId, {
      menuId: Number(menuId),
      includeImages: includeImages === 'true',
      includeReplies: includeReplies === 'true',
    });
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Cập nhật đánh giá hiện tại của tôi' })
  @Put('meal-reviews/my-current')
  async updateMyCurrentReview(@Body() dto: any, @Req() req: Request) {
    const userId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.updateMyCurrentReview(userId, dto);
    return { success: true, data, message: 'Cập nhật đánh giá thành công.' };
  }

  @ApiOperation({ summary: 'Cập nhật đánh giá theo ID' })
  @Put('meal-reviews/:id')
  async updateReviewById(@Param('id') id: string, @Body() dto: any, @Req() req: Request) {
    const userId = (req as any).user?.userId || 'System';
    const reviewId = Number(id);
    if (!Number.isFinite(reviewId)) throw new BadRequestException('ID đánh giá không hợp lệ.');
    const data = await this.canteenService.updateReviewById(userId, reviewId, dto);
    return { success: true, data, message: 'Cập nhật đánh giá thành công.' };
  }

  @ApiOperation({ summary: 'Tổng hợp đánh giá theo bữa ăn' })
  @UseGuards(CanteenEvaluationAccessGuard)
  @Get('meal-reviews/summary')
  async getMealReviewSummary(@Query() query: any) {
    const data = await this.canteenService.getMealReviewSummary(query);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Điểm trung bình theo tiêu chí' })
  @UseGuards(CanteenEvaluationAccessGuard)
  @Get('meal-reviews/criteria-averages')
  async getMealReviewCriteriaAverages(@Query() query: any) {
    const data = await this.canteenService.getMealReviewCriteriaAverages(query);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Danh sách đánh giá bữa ăn' })
  @UseGuards(CanteenEvaluationAccessGuard)
  @Get('meal-reviews')
  async getMealReviews(@Query() query: any) {
    const data = await this.canteenService.getMealReviews(query);
    return { success: true, ...data };
  }

  @ApiOperation({ summary: 'Chi tiết đánh giá bữa ăn' })
  @UseGuards(CanteenEvaluationAccessGuard)
  @Get('meal-reviews/:id')
  async getMealReviewDetail(@Param('id') id: string) {
    const reviewId = Number(id);
    if (!Number.isFinite(reviewId)) throw new BadRequestException('ID đánh giá không hợp lệ.');
    const data = await this.canteenService.getMealReviewDetail(reviewId);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Tạo phản hồi cho đánh giá' })
  @Post('meal-reviews/:reviewId/replies')
  async createMealReviewReply(@Param('reviewId') reviewId: string, @Body() dto: any, @Req() req: Request) {
    const userId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.createMealReviewReply(userId, Number(reviewId), dto);
    return { success: true, data, message: 'Gửi phản hồi thành công.' };
  }

  @ApiOperation({ summary: 'Danh sách phản hồi của đánh giá' })
  @Get('meal-reviews/:reviewId/replies')
  async getMealReviewReplies(@Param('reviewId') reviewId: string) {
    const data = await this.canteenService.getMealReviewReplies(Number(reviewId));
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Upload ảnh đính kèm đánh giá' })
  @Post('meal-reviews/:reviewId/images')
  @UseInterceptors(FilesInterceptor('files', 3))
  async uploadMealReviewImages(
    @Param('reviewId') reviewId: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId || 'System';
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const data = await this.canteenService.uploadMealReviewImages(userId, Number(reviewId), files || [], baseUrl);
    return { success: true, data, message: 'Tải ảnh thành công.' };
  }

  @ApiOperation({ summary: 'Xóa ảnh đánh giá' })
  @Delete('meal-review-images/:imageId')
  async deleteMealReviewImage(@Param('imageId') imageId: string, @Req() req: Request) {
    const userId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.deleteMealReviewImage(userId, Number(imageId));
    return { success: true, data, message: 'Đã xóa ảnh đính kèm.' };
  }

  @ApiOperation({ summary: 'Xuất Excel báo cáo đánh giá bữa ăn' })
  @UseGuards(CanteenEvaluationAccessGuard)
  @Get('meal-reviews/export-excel')
  async exportMealReviewsExcel(@Query() query: any, @Res() res: Response) {
    const file = await this.canteenService.exportMealReviewsExcel(query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    return res.send(file.buffer);
  }

  @ApiOperation({ summary: 'Dữ liệu in báo cáo đánh giá bữa ăn' })
  @UseGuards(CanteenEvaluationAccessGuard)
  @Get('meal-reviews/print-report')
  async getMealReviewPrintReport(@Query() query: any) {
    const data = await this.canteenService.getMealReviewPrintReport(query);
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/menus/week:
   *   post:
   *     summary: Lưu thực đơn tuần
   *     tags: [Canteen]
   */
  @ApiOperation({ summary: 'Lưu thực đơn tuần' })
  @Post('menus/week')
  async saveWeeklyMenu(
    @Body(new ZodValidationPipe(CreateWeeklyMenuSchema)) dto: CreateWeeklyMenuDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.saveWeeklyMenu(dto, userId);
    await this.trackAction(req, 'POST', `Lưu thực đơn tuần bắt đầu từ ${dto.week_start}`, 'MENU_SAVE');
    return { success: true, data };
  }



  @ApiOperation({ summary: 'Lưu thực đơn (Phiên bản mới)' })
  @Post('menus')
  async saveWeeklyMenuV2(
    @Body(new ZodValidationPipe(WeeklyMenuSaveSchema)) dto: WeeklyMenuSaveDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.saveWeeklyMenuV2(dto, userId);
    await this.trackAction(req, 'POST', `Lưu thực đơn tuần bắt đầu từ ${dto.startDate}`, 'MENU_SAVE_V2');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/menus/templates:
   *   get:
   *     summary: Lấy danh sách bản mẫu thực đơn
   *     tags: [Canteen]
   */
  @ApiOperation({ summary: 'Lấy danh sách bản mẫu thực đơn' })
  @Get('menus/templates')
  async getTemplates() {
    const data = await this.canteenService.findAllTemplates();
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/menus/templates:
   *   post:
   *     summary: Lưu bản mẫu thực đơn mới
   *     tags: [Canteen]
   */
  @ApiOperation({ summary: 'Lưu bản mẫu thực đơn mới' })
  @Post('menus/templates')
  async saveTemplate(
    @Body(new ZodValidationPipe(CreateTemplateSchema)) dto: CreateTemplateDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.saveAsTemplate(dto, userId);
    await this.trackAction(req, 'POST', `Lưu bản mẫu thực đơn mới: ${dto.name}`, 'TEMPLATE_SAVE');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/menus/templates/apply:
   *   post:
   *     summary: Áp dụng bản mẫu cho tuần
   *     tags: [Canteen]
   */
  @ApiOperation({ summary: 'Áp dụng bản mẫu cho tuần' })
  @Post('menus/templates/apply')
  async applyTemplate(
    @Body(new ZodValidationPipe(ApplyTemplateSchema)) dto: ApplyTemplateDto,
    @Req() req: Request,
  ) {
    const data = await this.canteenService.applyTemplate(dto);
    await this.trackAction(req, 'POST', `Áp dụng bản mẫu ID ${dto.template_id} cho tuần ${dto.week_start}`, 'TEMPLATE_APPLY');
    return { success: true, data };
  }


  /**
   * @swagger
   * /api/v1/menus/publish:
   *   post:
   *     summary: Công bố thực đơn tuần
   *     tags: [Canteen]
   */
  @ApiOperation({ summary: 'Công bố thực đơn tuần' })
  @Post('menus/publish')
  async publishMenu(
    @Body('week_start') weekStart: string,
    @Req() req: Request
  ) {
    const data = await this.canteenService.publishMenu(weekStart);
    await this.trackAction(req, 'POST', `Công bố thực đơn tuần ${weekStart}`, 'MENU_PUBLISH');
    return { success: true, data };
  }

  // --- Daily Menu CRUD ---

  /**
   * @swagger
   * /api/v1/menus/day:
   *   get:
   *     summary: Lấy thực đơn của một ngày
   *     tags: [Canteen]
   */
  @ApiOperation({ summary: 'Lấy thực đơn của một ngày' })
  @Get('menus/day')
  async getDailyMenu(@Query('date') date: string) {
    console.log(`[CanteenController] getDailyMenu called for date: ${date}`);
    const data = await this.canteenService.findDailyMenuV2(date);
    console.log(`[CanteenController] getDailyMenu result:`, data ? 'Object found' : 'null');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/menus/day:
   *   post:
   *     summary: Lưu thực đơn của một ngày
   *     tags: [Canteen]
   */
  @ApiOperation({ summary: 'Lưu thực đơn của một ngày' })
  @Post('menus/day')
  async saveDailyMenu(
    @Body(new ZodValidationPipe(DailyMenuSchema)) dto: DailyMenuDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.saveDailyMenu(dto, userId);
    await this.trackAction(req, 'POST', `Lưu thực đơn ngày ${dto.date}`, 'DAILY_MENU_SAVE');
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Lưu thiết lập thực đơn hàng ngày (Mới)' })
  @Post('menus/day-setup')
  async saveDailyMenuSetup(
    @Body(new ZodValidationPipe(DailyMenuSetupSaveSchema)) dto: DailyMenuSetupSaveDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.saveDailyMenuSetup(dto, userId);
    await this.trackAction(req, 'POST', `Thiết lập thực đơn ngày ${dto.date}`, 'DAILY_MENU_SETUP_SAVE');
    return { success: true, data };
  }


  /**
   * @swagger
   * /api/v1/menus/day/{id}:
   *   delete:
   *     summary: Xóa một bữa ăn (slot) trong ngày
   *     tags: [Canteen]
   */
  @ApiOperation({ summary: 'Xóa một bữa ăn (slot) trong ngày' })
  @Delete('menus/day/:id')
  @ApiParam({ name: 'id', type: 'number' })
  async deleteMenu(@Param('id') id: string, @Req() req: Request) {
    const data = await this.canteenService.deleteMenu(Number(id));
    await this.trackAction(req, 'DELETE', `Xóa bữa ăn ID ${id}`, 'MENU_DELETE');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/menus/day/{id}/status:
   *   patch:
   *     summary: Cập nhật trạng thái bữa ăn (draft/published)
   *     tags: [Canteen]
   */
  @ApiOperation({ summary: 'Cập nhật trạng thái bữa ăn' })
  @Patch('menus/day/:id/status')
  @ApiParam({ name: 'id', type: 'number' })
  async updateMenuStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateMenuStatusSchema)) dto: UpdateMenuStatusDto,
    @Req() req: Request,
  ) {
    const data = await this.canteenService.updateMenuStatus(Number(id), dto.status);
    await this.trackAction(req, 'PATCH', `Cập nhật trạng thái bữa ăn ID ${id} thành ${dto.status}`, 'MENU_STATUS_UPDATE');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/menus/day/copy:
   *   post:
   *     summary: Sao chép thực đơn từ ngày này sang ngày khác
   *     tags: [Canteen]
   */
  @ApiOperation({ summary: 'Sao chép thực đơn từ ngày sang ngày' })
  @Post('menus/day/copy')
  async copyDailyMenu(
    @Body(new ZodValidationPipe(CopyDailyMenuSchema)) dto: CopyDailyMenuDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.copyDailyMenu(dto, userId);
    await this.trackAction(req, 'POST', `Sao chép thực đơn từ ${dto.from_date} sang ${dto.to_date}`, 'DAILY_MENU_COPY');
    return { success: true, data };
  }

  // --- Meal Registration (Employee) ---

  /**
   * @swagger
   * /api/v1/registrations/my:
   *   get:
   *     summary: Lấy danh sách đăng ký của tôi (theo tháng)
   *     tags: [Canteen]
   */
  @Get('registrations/my')
  @ApiOperation({ summary: 'Lấy danh sách đăng ký của tôi (theo tháng)' })
  async getMyRegistrations(@Query('month') month: string, @Req() req: Request) {
    const userId = (req as any).user?.userId;
    const data = await this.canteenService.findMyRegistrations(userId, month);
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/registrations:
   *   post:
   *     summary: Đăng ký suất ăn
   *     tags: [Canteen]
   */
  @Post('registrations')
  @ApiOperation({ summary: 'Đăng ký suất ăn' })
  async registerMeal(
    @Body(new ZodValidationPipe(RegisterMealSchema)) dto: RegisterMealDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId;
    const data = await this.canteenService.registerMeal(userId, dto as any);
    await this.trackAction(req, 'POST', `Đăng ký suất ăn cho menu ID ${(dto as any).menu_id}`, 'MEAL_REGISTER');
    return { success: true, data };
  }


  /**
   * @swagger
   * /api/v1/registrations/bulk:
   *   post:
   *     summary: Đăng ký nhanh (Bulk)
   *     tags: [Canteen]
   */
  @Post('registrations/bulk')
  @ApiOperation({ summary: 'Đăng ký nhanh (Bulk)' })
  async bulkRegister(
    @Body(new ZodValidationPipe(BulkRegisterSchema)) dto: BulkRegisterDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId;
    const data = await this.canteenService.bulkRegister(userId, dto as any);
    await this.trackAction(req, 'POST', `Đăng ký nhanh từ ${(dto as any).start_date} đến ${(dto as any).end_date}`, 'MEAL_BULK_REGISTER');
    return { success: true, data };
  }


  /**
   * @swagger
   * /api/v1/registrations/{id}/cancel:
   *   post:
   *     summary: Hủy đăng ký suất ăn
   *     tags: [Canteen]
   */
  @Post('registrations/:id/cancel')
  @ApiOperation({ summary: 'Hủy đăng ký suất ăn' })
  @ApiParam({ name: 'id', type: 'number' })
  async cancelRegistration(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CancelRegistrationSchema)) dto: CancelRegistrationDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId;
    const data = await this.canteenService.cancelRegistration(userId, Number(id), dto.reason);
    await this.trackAction(req, 'POST', `Hủy đăng ký suất ăn ID ${id}. Lý do: ${dto.reason}`, 'MEAL_CANCEL');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/registrations:
   *   get:
   *     summary: Lấy tất cả đăng ký suất ăn (Admin)
   *     tags: [Canteen]
   */
  @Get('registrations')
  @ApiOperation({ summary: 'Lấy tất cả đăng ký suất ăn (Admin)' })
  async getAdminRegistrations(
    @Query('date') date: string,
    @Query('dept') dept?: string,
    @Query('slot') slot?: string,
    @Query('q') q?: string,
    @Req() req?: Request,
  ) {
    const data = await this.canteenService.findAllRegistrations({ date, dept, slot, q });
    if (req) await this.trackAction(req, 'GET', `Xem danh sách đăng ký ngày ${date}`, 'ADMIN_VIEW_REGISTRATIONS');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/registrations/summary:
   *   get:
   *     summary: Lấy tóm tắt đăng ký suất ăn hàng ngày (Admin)
   *     tags: [Canteen]
   */
  @Get('registrations/summary')
  @ApiOperation({ summary: 'Lấy tóm tắt đăng ký suất ăn hàng ngày (Admin)' })
  async getDailySummary(@Query('date') date: string) {
    const data = await this.canteenService.getDailySummary(date);
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/canteen/departments:
   *   get:
   *     summary: Lấy danh sách phòng ban
   *     tags: [Canteen]
   */
  @Get('canteen/departments')
  @ApiOperation({ summary: 'Lấy danh sách phòng ban' })
  async getDepartments() {
    const data = await this.canteenService.findAllDepartments();
    return { success: true, data };
  }

  // --- API v2 for FE Canteen pages ---

  @Get('canteen/calendar')
  @ApiOperation({ summary: 'Lấy lịch đăng ký theo khoảng ngày (FE v2)' })
  async getCalendarV2(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId;
    const data = await this.canteenService.getCalendarV2(userId, startDate, endDate);
    return { success: true, data };
  }

  @Get('canteen/my-registrations')
  @ApiOperation({ summary: 'Lấy danh sách đăng ký của tôi (FE v2)' })
  async getMyRegistrationsV2(@Query() query: any, @Req() req: Request) {
    const userId = (req as any).user?.userId;
    const data = await this.canteenService.getMyRegistrationsV2(userId, query || {});
    return { success: true, data };
  }

  @Get('canteen/my-stats')
  @ApiOperation({ summary: 'Thống kê đăng ký của tôi (FE v2)' })
  async getMyStatsV2(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId;
    const data = await this.canteenService.getMyStatsV2(userId, startDate, endDate);
    return { success: true, data };
  }

  @Post('canteen/register')
  @ApiOperation({ summary: 'Đăng ký suất ăn theo ngày (FE v2)' })
  async registerByDateV2(@Body() dto: any, @Req() req: Request) {
    const userId = (req as any).user?.userId;
    try {
      const data = await this.canteenService.registerByDateV2(userId, {
        date: dto?.date,
        meal_session_ids: dto?.meal_session_ids || [],
        note: dto?.note || null,
      });
      return { success: true, data };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message = (error as any)?.message || 'Đăng ký suất ăn thất bại.';
      throw new BadRequestException(message);
    }
  }

  @Post('canteen/register-by-date')
  @ApiOperation({ summary: 'Đăng ký suất ăn theo ngày (FE v2 - stable route)' })
  async registerByDateV2Stable(@Body() dto: any, @Req() req: Request) {
    const userId = (req as any).user?.userId;
    const data = await this.canteenService.registerByDateV2(userId, {
      date: dto?.date,
      meal_session_ids: dto?.meal_session_ids || [],
      note: (dto as any).note ?? null,
    });
    return { success: true, data };
  }

  @Patch('canteen/registrations/:id')
  @ApiOperation({ summary: 'Chỉnh sửa đăng ký suất ăn theo ngày (FE v2)' })
  async updateRegistrationV2(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateRegistrationSchema)) dto: UpdateRegistrationDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId;
    const data = await this.canteenService.updateRegistrationV2(userId, id, dto || {});
    return { success: true, data };
  }

  @Patch('canteen/registrations/:id/cancel')
  @ApiOperation({ summary: 'Hủy đăng ký suất ăn (FE v2)' })
  async cancelRegistrationV2(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(CancelRegistrationSchema)) dto: CancelRegistrationDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId;
    const data = await this.canteenService.cancelRegistration(userId, id, dto?.reason || null);
    return { success: true, data };
  }

  @Post('canteen/quick-register/week')
  @ApiOperation({ summary: 'Đăng ký nhanh cả tuần (FE v2)' })
  async quickRegisterWeekV2(@Body() dto: any, @Req() req: Request) {
    const userId = (req as any).user?.userId;
    const data = await this.canteenService.quickRegisterWeekV2(userId, dto || {});
    return { success: true, data };
  }

  @Post('canteen/quick-register/month')
  @ApiOperation({ summary: 'Đăng ký nhanh cả tháng (FE v2)' })
  async quickRegisterMonthV2(@Body() dto: any, @Req() req: Request) {
    const userId = (req as any).user?.userId;
    const data = await this.canteenService.quickRegisterMonthV2(userId, dto || {});
    return { success: true, data };
  }

  // Backward compatibility aliases used by FE service
  @Post('canteen/bulk-register')
  @ApiOperation({ summary: 'Alias đăng ký nhanh (bulk) cho FE v2' })
  async bulkRegisterAlias(@Body() dto: any, @Req() req: Request) {
    const userId = (req as any).user?.userId;
    const hasFilterPayload =
      dto?.start_date &&
      dto?.end_date &&
      Array.isArray(dto?.days_of_week) &&
      (Array.isArray(dto?.meal_session_ids) || dto?.template_id);

    if (hasFilterPayload) {
      const data = await this.canteenService.bulkRegisterByFiltersV2(userId, {
        start_date: dto.start_date,
        end_date: dto.end_date,
        days_of_week: dto.days_of_week,
        meal_session_ids: dto.meal_session_ids || [],
        template_id: dto.template_id ? Number(dto.template_id) : undefined,
      });
      return { success: true, data };
    }

    if (String(dto?.period || '').toUpperCase() === 'WEEK') {
      const data = await this.canteenService.quickRegisterWeekV2(userId, {
        week_start_date: dto?.start_date || moment().startOf('isoWeek').format('YYYY-MM-DD'),
      });
      return { success: true, data };
    }
    const data = await this.canteenService.quickRegisterMonthV2(userId, {
      month: dto?.month || moment().format('YYYY-MM'),
    });
    return { success: true, data };
  }

  @Post('canteen/bulk-register-by-filters')
  @ApiOperation({ summary: 'Đăng ký hàng loạt theo bộ lọc (FE v2 - stable route)' })
  async bulkRegisterByFiltersStable(@Body() dto: any, @Req() req: Request) {
    const userId = (req as any).user?.userId;
    const data = await this.canteenService.bulkRegisterByFiltersV2(userId, {
      start_date: dto?.start_date,
      end_date: dto?.end_date,
      days_of_week: Array.isArray(dto?.days_of_week) ? dto.days_of_week : [1, 2, 3, 4, 5],
      meal_session_ids: Array.isArray(dto?.meal_session_ids) ? dto.meal_session_ids : [],
      template_id: dto?.template_id ? Number(dto.template_id) : undefined,
    });
    return { success: true, data };
  }

  @Get('canteen/admin/settings')
  @ApiOperation({ summary: 'Lấy cài đặt hệ thống canteen (FE v2)' })
  async getSystemSettingsV2() {
    const settings = await this.canteenService.getSettings();
    const settingRows = Object.values(settings || {}).flatMap((group: any) =>
      Object.entries(group || {}).map(([key, entry]: [string, any]) => ({
        key,
        value: entry?.value,
      })),
    );
    const map = new Map(settingRows.map((s: any) => [s?.key, s?.value]));
    const data = {
      registrationDeadlineTime: map.get('registration_deadline_time') || '16:00',
      cancellationDeadlineTime: map.get('cancellation_deadline_time') || '10:00',
      allowMultiMeal: String(map.get('allow_multi_meal') ?? 'true') === 'true',
      allowBulkRegistration: String(map.get('allow_bulk_registration') ?? 'true') === 'true',
      autoCancelOnBusinessTrip: String(map.get('auto_cancel_on_business_trip') ?? 'true') === 'true',
      autoCancelOnLeave: String(map.get('auto_cancel_on_leave') ?? 'true') === 'true',
      requireCancelReason: String(map.get('require_cancel_reason') ?? 'false') === 'true',
      weekendService: String(map.get('weekend_service') ?? 'false') === 'true',
      refundRateOnTime: Number(map.get('refund_rate_on_time') ?? 100),
      refundRateLate: Number(map.get('refund_rate_late') ?? 0),
    };
    return { success: true, data };
  }

  @Patch('canteen/admin/settings')
  @ApiOperation({ summary: 'Cập nhật cài đặt hệ thống canteen (FE v2)' })
  async updateSystemSettingsV2(@Body() dto: any, @Req() req: Request) {
    const keyAliasMap: Record<string, string> = {
      registrationDeadlineTime: 'registration_deadline_time',
      cancellationDeadlineTime: 'cancellation_deadline_time',
      allowMultiMeal: 'allow_multi_meal',
      allowBulkRegistration: 'allow_bulk_registration',
      autoCancelOnBusinessTrip: 'auto_cancel_on_business_trip',
      autoCancelOnLeave: 'auto_cancel_on_leave',
      requireCancelReason: 'require_cancel_reason',
      weekendService: 'weekend_service',
      refundRateOnTime: 'refund_rate_on_time',
      refundRateLate: 'refund_rate_late',
    };
    const normalizeKey = (key: string) => keyAliasMap[key] || key;
    const resolveGroup = (key: string) => {
      if (['registration_deadline_time', 'cancellation_deadline_time'].includes(key)) return 'deadline';
      if (
        [
          'breakfast_active',
          'breakfast_start_time',
          'breakfast_end_time',
          'breakfast_price',
          'lunch_active',
          'lunch_start_time',
          'lunch_end_time',
          'lunch_price',
          'dinner_active',
          'dinner_start_time',
          'dinner_end_time',
          'dinner_price',
        ].includes(key)
      ) {
        return 'meal_session';
      }
      if (
        [
          'allow_multi_meal',
          'allow_bulk_registration',
          'auto_cancel_on_business_trip',
          'auto_cancel_on_leave',
          'require_cancel_reason',
          'weekend_service',
        ].includes(key)
      ) {
        return 'rules';
      }
      if (['reminder_enabled', 'reminder_time', 'daily_menu_notify_time'].includes(key)) {
        return 'notification';
      }
      if (['hr_sync_enabled', 'hr_sync_endpoint'].includes(key)) return 'integration';
      if (['refund_on_time_rate', 'refund_late_rate', 'refund_rate_on_time', 'refund_rate_late'].includes(key)) {
        return 'refund';
      }
      return 'canteen_system';
    };

    const items = Array.isArray(dto)
      ? dto
      : Object.entries(dto || {}).map(([key, value]) => ({ key, value }));

    const settings = items
      .map((item: any) => {
        const key = normalizeKey(String(item?.key || '').trim());
        if (!key) return null;
        const value = item?.value;
        const valueType = String(item?.value_type || '').trim().toLowerCase();
        return {
          id: Number(item?.id ?? 0) || undefined,
          group: String(item?.group || '').trim() || resolveGroup(key),
          key,
          value,
          value_type: valueType || typeof value,
          label: String(item?.label || key),
          description: String(item?.description || key),
          is_public: Number(item?.is_public ?? 0) ? 1 : 0,
        };
      })
      .filter(Boolean);
    const data = await this.canteenService.updateSettings(settings as any);
    await this.trackAction(req, 'PATCH', 'Update canteen admin settings (v2)', 'SETTINGS_UPDATE_V2');
    return { success: true, data };
  }

  @Get('canteen/admin/user-settings')
  @ApiOperation({ summary: 'Lấy cài đặt tự động cá nhân (FE v2)' })
  async getUserSettingsV2(@Req() req: Request) {
    const userId = (req as any).user?.userId;
    const settings = await this.canteenAdminService.getUserSettings(userId);
    return {
      success: true,
      data: {
        autoCancelOnTrip: Boolean(settings?.autoCancelOnTrip),
        autoCancelOnLeave: Boolean(settings?.autoCancelOnLeave),
        receiveEmailNotification: Boolean(settings?.receiveEmailNotification),
        remindBefore1Day: Boolean(settings?.remindBefore1Day),
      },
    };
  }

  @Patch('canteen/admin/user-settings')
  @ApiOperation({ summary: 'Cập nhật cài đặt tự động cá nhân (FE v2)' })
  async updateUserSettingsV2(@Body() dto: any, @Req() req: Request) {
    const userId = (req as any).user?.userId;
    const payload = {
      auto_cancel_on_trip: dto?.autoCancelOnTrip ?? dto?.auto_cancel_on_trip,
      auto_cancel_on_leave: dto?.autoCancelOnLeave ?? dto?.auto_cancel_on_leave,
      receive_email_notification: dto?.receiveEmailNotification ?? dto?.receive_email_notification,
      remind_before_1_day: dto?.remindBefore1Day ?? dto?.remind_before_1_day,
    };
    const data = await this.canteenAdminService.updateUserSettings(userId, payload as any);
    return { success: true, data };
  }

  @Get('canteen/admin/registrations')
  @ApiOperation({ summary: 'Danh sách đăng ký suất ăn cho màn admin (FE v2)' })
  async getAdminRegistrationsV2(
    @Query('date') date: string,
    @Query('dept') dept?: string,
    @Query('slot') slot?: string,
    @Query('q') q?: string,
  ) {
    const data = await this.canteenService.findAllRegistrations({ date, dept, slot, q } as any);
    return { success: true, data };
  }

  @Get('canteen/admin/registrations/summary')
  @ApiOperation({ summary: 'Tóm tắt đăng ký suất ăn theo ngày cho admin (FE v2)' })
  async getAdminDailySummaryV2(@Query('date') date: string) {
    const data = await this.canteenService.getDailySummary(date || moment().format('YYYY-MM-DD'));
    return { success: true, data };
  }

  // --- Module 2: Check-in & Reconciliation ---

  @ApiOperation({ summary: 'Thực hiện Check-in (QR/Manual)' })
  @Post('check-in')
  async checkIn(@Body(new ZodValidationPipe(CheckInSchema)) dto: CheckInDto, @Req() req: Request) {
    const adminId = (req as any).user?.userId;
    const data = await this.canteenService.checkIn(dto, adminId);
    await this.trackAction(req, 'POST', `Check-in cho user ${dto.user_id}, menu ${dto.menu_id}`, 'CHECKIN');
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Ghi nhận số lượng suất ăn thực tế' })
  @Post('actual-serving')
  async recordActualServing(@Body(new ZodValidationPipe(ActualServingSchema)) dto: ActualServingDto, @Req() req: Request) {
    const adminId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.recordActualServing(dto, adminId);
    await this.trackAction(req, 'POST', `Ghi nhận suất ăn thực tế cho menu ${dto.menu_id}: ${dto.actual_qty}`, 'ACTUAL_SERVING');
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Lấy báo cáo đối soát' })
  @Get('reconciliation')
  async getReconciliation(@Query('start_date') start: string, @Query('end_date') end: string) {
    const data = await this.canteenService.getReconciliationReport(start, end);
    return { success: true, data };
  }

  // --- Module 3: Supplier Management ---

  @ApiOperation({ summary: 'Quản lý hợp đồng nhà cung cấp' })
  @Post('suppliers/:id/contracts')
  async manageContract(@Param('id') id: string, @Body(new ZodValidationPipe(SupplierContractSchema)) dto: SupplierContractDto, @Req() req: Request) {
    const adminId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.manageSupplierContract(dto, adminId);
    await this.trackAction(req, 'POST', `Quản lý hợp đồng cho NCC ID ${id}`, 'SUPPLIER_CONTRACT');
    return { success: true, data };
  }


  @ApiOperation({ summary: 'Tạo đơn hàng NCC' })
  @Post('supplier-orders')
  async createOrder(@Body(new ZodValidationPipe(SupplierOrderSchema)) dto: SupplierOrderDto, @Req() req: Request) {
    const adminId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.createSupplierOrder(dto, adminId);
    await this.trackAction(req, 'POST', `Tạo đơn hàng NCC cho ngày ${dto.order_date}`, 'SUPPLIER_ORDER');
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Lấy thống kê đánh giá nhà cung cấp' })
  @Get('supplier-evaluations/stats')
  async getSupplierEvaluationStats() {
    const data = await this.canteenService.getSupplierEvaluationDashboardStats();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Gửi hoặc cập nhật đánh giá NCC' })
  @Post('supplier-evaluations')
  async submitEvaluation(@Body(new ZodValidationPipe(SupplierEvaluationSchema)) dto: SupplierEvaluationDto, @Req() req: Request) {
    const adminId = (req as any).user?.userId || 'System';

    // Mapping for flat payload from new UI (backward compatibility)
    if ((!dto.scores || dto.scores.length === 0) && dto.food_quality_score !== undefined) {
      const commonDishId = dto.dish_id ? Number(dto.dish_id) : null;
      dto.scores = [
        { criterion_code: 'food_quality', score: dto.food_quality_score },
        { criterion_code: 'delivery_time', score: dto.delivery_time_score || 0 },
        { criterion_code: 'hygiene_safety', score: dto.hygiene_safety_score || 0 },
        { criterion_code: 'service_attitude', score: dto.service_attitude_score || 0 },
      ];
    }

    if (!dto.supplier_order_id && dto.order_id) {
      dto.supplier_order_id = Number(dto.order_id);
    }

    if (!dto.period_type && dto.supplier_order_id) {
      dto.period_type = 'delivery';
    }

    if (!dto.evaluation_status || dto.evaluation_status === 'draft') {
      dto.evaluation_status = 'submitted';
    }

    const data = await this.canteenService.submitEvaluation(dto, adminId);
    await this.trackAction(req, 'POST', `Gửi đánh giá cho NCC ID ${dto.supplier_id}`, 'SUPPLIER_EVALUATION');
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Cập nhật đánh giá NCC' })
  @Put('supplier-evaluations/:id')
  @ApiParam({ name: 'id', type: 'number' })
  async updateEvaluation(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(SupplierEvaluationSchema)) dto: SupplierEvaluationDto,
    @Req() req: Request,
  ) {
    const adminId = (req as any).user?.userId || 'System';
    dto.id = id; // Ensure consistency with URL param

    // Mapping for flat payload from new UI (backward compatibility)
    if ((!dto.scores || dto.scores.length === 0) && dto.food_quality_score !== undefined) {
      dto.scores = [
        { criterion_code: 'food_quality', score: dto.food_quality_score },
        { criterion_code: 'delivery_time', score: dto.delivery_time_score || 0 },
        { criterion_code: 'hygiene_safety', score: dto.hygiene_safety_score || 0 },
        { criterion_code: 'service_attitude', score: dto.service_attitude_score || 0 },
      ];
    }

    if (!dto.evaluation_status || dto.evaluation_status === 'draft') {
      dto.evaluation_status = 'submitted';
    }

    const data = await this.canteenService.submitEvaluation(dto, adminId);
    await this.trackAction(req, 'PUT', `Cập nhật đánh giá ID ${id}`, 'SUPPLIER_EVAL_UPDATE');
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Lấy tổng quan đánh giá nhà cung cấp (Counts)' })
  @Get('supplier-evaluations/overview')
  async getEvaluationsOverview() {
    const data = await this.canteenService.getSupplierEvaluationsOverview();
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Lấy danh sách đánh giá NCC' })
  @Get('supplier-evaluations')
  async getEvaluations(@Query() query: any) {
    const result = await this.canteenService.findAllEvaluations(query);
    return { success: true, ...result };
  }

  @ApiOperation({ summary: 'Lấy chi tiết đánh giá NCC' })
  @Get('supplier-evaluations/:id')
  @ApiParam({ name: 'id', type: 'number' })
  async getEvaluationDetail(@Param('id') id: string) {
    const data = await this.canteenService.findEvaluationDetail(Number(id));
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Xóa đánh giá NCC' })
  @Delete('supplier-evaluations/:id')
  @ApiParam({ name: 'id', type: 'number' })
  async deleteEvaluation(@Param('id') id: string, @Req() req: Request) {
    const adminId = (req as any).user?.userId || 'System';
    const data = await this.canteenService.deleteEvaluation(Number(id), adminId);
    await this.trackAction(req, 'DELETE', `Xóa đánh giá ID ${id}`, 'SUPPLIER_EVAL_DELETE');
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Thống kê đánh giá NCC' })
  @Get('suppliers/:id/evaluation-stats')
  @ApiParam({ name: 'id', type: 'number' })
  async getSupplierStats(@Param('id') id: string) {
    const data = await this.canteenService.getSupplierEvaluationStats(Number(id));
    return { success: true, data };
  }

  // Audit Logging Helper
  private async trackAction(req: any, method: string, details: string, subType: string) {
    const userId = req.user?.userId;
    try {
      await this.systemLogService.createLogFromSystem({
        action: method,
        details: `CANTEEN: ${details}`,
        method: method,
        status: 'SUCCESS',
        type: 'CANTEEN',
        subType: subType,
        userInfo: userId || 'System',
        ipAddress: req?.ip || req?.connection?.remoteAddress || 'Unknown',
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to log canteen action:', e);
    }
  }
}
