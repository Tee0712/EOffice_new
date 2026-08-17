import { Response as ExpressResponse } from 'express';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UsePipes,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  ParseIntPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/oauth/jwt.guard';
import { AsxhInKindService } from '../service/asxh-in-kind.service';
import {
  AssetOverviewQueryDto,
  AssetListingQuerySchema,
  AssetListingQueryDto,
  CreateAssetSchema,
  CreateAssetDto,
  UpdateAssetSchema,
  UpdateAssetDto,
  CreateAssetSpecSchema,
  CreateAssetSpecDto,
  AssetAttachmentSchema,
  AssetAttachmentDto,
  LinkHandoverSchema,
  LinkHandoverDto,
  HandoverContextQuerySchema,
  HandoverContextQueryDto,
  HandoverListingQuerySchema,
  HandoverListingQueryDto,
  CreateHandoverSchema,
  CreateHandoverDto,
  UpdateHandoverSchema,
  UpdateHandoverDto,
  UpdateHandoverStatusDto,
  UpdateHandoverStatusSchema,
  HandoverChecklistUpdateSchema,
  UserSearchQuerySchema,
  UserSearchQueryDto,
  UserSimpleResponseDto,
} from '../dto/asxh-in-kind';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierListingQueryDto,
  CreateSupplierSchema,
  SupplierListingQuerySchema,
} from '../dto/supplier.dto';
import { ZodValidationPipe } from '../dto/zod-validation.pipe';
import { SystemLogServiceSql } from 'src/systemLogManagement/system-log-service-sql';

@ApiTags('ASXH - Quản lý Hiện vật (In-kind)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1')
export class AsxhInKindController {
  constructor(
    private readonly inKindService: AsxhInKindService,
    private readonly systemLogService: SystemLogServiceSql,
  ) { }

  /**
   * @swagger
   * /api/v1/assets/statuses:
   *   get:
   *     summary: Lấy danh mục trạng thái hiện vật
   *     tags: [ASXH In-kind]
   *     responses:
   *       200:
   *         description: Thành công
   */
  @Get('assets/statuses')
  @ApiOperation({ summary: '0. Danh mục trạng thái hiện vật' })
  async getStatuses() {
    return {
      success: true,
      data: await this.inKindService.getStatuses(),
    };
  }

  /**
   * @swagger
   * /api/v1/programs/{program_id}/in-kind/overview:
   *   get:
   *     summary: Load tổng quan màn (Header + tiến độ 3 bước + KPI)
   *     parameters:
   *       - name: program_id
   *         in: path
   *         required: true
   *         schema: { type: integer }
   */
  @Get('programs/:program_id/in-kind/overview')
  @ApiOperation({ summary: '1. Load tổng quan màn (Header + tiến độ 3 bước + KPI)' })
  async getOverview(@Param('program_id', ParseIntPipe) programId: number, @Req() req: any) {
    const data = await this.inKindService.getOverview(programId);
    await this.trackAction(req, 'GET', `Xem tổng quan hiện vật chương trình ID ${programId}`, 'INKIND_OVERVIEW');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/programs/{program_id}/in-kind/assets:
   *   get:
   *     summary: Lấy danh sách hiện vật với filter và phân trang
   *     parameters:
   *       - name: program_id
   *         in: path
   *         required: true
   *         schema: { type: integer }
   */
  @Get('programs/:program_id/in-kind/assets')
  @ApiOperation({ summary: '13. Danh sách hiện vật theo chương trình' })
  async getAssets(
    @Param('program_id', ParseIntPipe) programId: number,
    @Query(new ZodValidationPipe(AssetListingQuerySchema)) query: AssetListingQueryDto,
    @Req() req: any,
  ) {
    const data = await this.inKindService.getAssets(programId, query);
    await this.trackAction(req, 'GET', `Xem danh sách hiện vật chương trình ID ${programId}`, 'INKIND_LIST');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/programs/{program_id}/in-kind/assets/export:
   *   get:
   *     summary: Xuất danh sách hiện vật (Excel)
   *     parameters:
   *       - name: program_id
   *         in: path
   *         required: true
   *         schema: { type: integer }
   */
  @Get('programs/:program_id/in-kind/assets/export')
  @ApiOperation({ summary: '13a. Xuất Excel danh sách hiện vật' })
  async exportAssets(
    @Param('program_id', ParseIntPipe) programId: number,
    @Query(new ZodValidationPipe(AssetListingQuerySchema)) query: AssetListingQueryDto,
    @Req() req: any,
    @Res() res: ExpressResponse,
  ) {
    await this.inKindService.exportAssets(programId, query, res);
    await this.trackAction(req, 'GET', `Xuất Excel danh sách hiện vật chương trình ID ${programId}`, 'INKIND_EXPORT');
  }

  /**
   * @swagger
   * /api/v1/programs/{program_id}/suppliers/summary:
   *   get:
   *     summary: Tổng hợp nhà cung cấp theo chương trình
   *     tags: [ASXH In-kind]
   */
  @Get('programs/:program_id/suppliers/summary')
  @ApiOperation({ summary: '2.1 Tổng hợp nhà cung cấp theo chương trình (Dashboard)' })
  async getSupplierSummary(@Param('program_id', ParseIntPipe) programId: number, @Req() req: any) {
    const data = await this.inKindService.getSupplierSummary(programId);
    await this.trackAction(req, 'GET', `Xem tổng hợp nhà cung cấp chương trình ID ${programId}`, 'SUPPLIER_SUMMARY');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/programs/{program_id}/assets:
   *   post:
   *     summary: Tạo mới hiện vật
   */
  @Post('programs/:program_id/assets')
  @ApiOperation({ summary: '3. Tạo mới hiện vật' })
  async createAsset(
    @Param('program_id', ParseIntPipe) programId: number,
    @Body(new ZodValidationPipe(CreateAssetSchema)) body: CreateAssetDto,
    @Req() req: any,
  ) {
    const data = await this.inKindService.createAsset(programId, body);
    await this.trackAction(req, 'POST', `Tạo mới hiện vật: ${body.name} cho chương trình ID ${programId}`, 'ASSET_CREATE');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/assets/{asset_id}:
   *   get:
   *     summary: Lấy chi tiết 1 hiện vật
   */
  @Get('assets/:asset_id')
  @ApiOperation({ summary: '4. Chi tiết hiện vật' })
  async getAssetDetail(@Param('asset_id', ParseIntPipe) assetId: number, @Req() req: any) {
    const data = await this.inKindService.getAssetDetail(assetId);
    await this.trackAction(req, 'GET', `Xem chi tiết hiện vật ID ${assetId}`, 'ASSET_DETAIL');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/assets/{asset_id}:
   *   put:
   *     summary: Cập nhật thông tin hiện vật
   */
  @Put('assets/:asset_id')
  @ApiOperation({ summary: '5. Cập nhật thông tin hiện vật' })
  async updateAsset(
    @Param('asset_id', ParseIntPipe) assetId: number,
    @Body(new ZodValidationPipe(UpdateAssetSchema)) body: UpdateAssetDto,
    @Req() req: any,
  ) {
    const data = await this.inKindService.updateAsset(assetId, body);
    await this.trackAction(req, 'PUT', `Cập nhật hiện vật ID ${assetId}`, 'ASSET_UPDATE');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/assets/{asset_id}:
   *   delete:
   *     summary: Xóa hiện vật
   */
  @Delete('assets/:asset_id')
  @ApiOperation({ summary: '6. Xóa hiện vật (Chỉ xóa khi trạng thái Tiếp nhận và chưa lên lịch)' })
  async deleteAsset(@Param('asset_id', ParseIntPipe) assetId: number, @Req() req: any) {
    const data = await this.inKindService.deleteAsset(assetId);
    await this.trackAction(req, 'DELETE', `Xóa hiện vật ID ${assetId}`, 'ASSET_DELETE');
    return { ...data };
  }

  /**
   * @swagger
   * /api/v1/assets/{asset_id}/specifications:
   *   post:
   *     summary: Thêm thông số kỹ thuật cho hiện vật
   */
  @Post('assets/:asset_id/specifications')
  @ApiOperation({ summary: '7. Thêm thông số kỹ thuật' })
  async addSpecification(
    @Param('asset_id', ParseIntPipe) assetId: number,
    @Body(new ZodValidationPipe(CreateAssetSpecSchema)) body: CreateAssetSpecDto,
    @Req() req: any,
  ) {
    const data = await this.inKindService.addSpecification(assetId, body);
    await this.trackAction(req, 'POST', `Thêm thông số kỹ thuật cho hiện vật ID ${assetId}`, 'ASSET_SPEC_ADD');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/assets/specifications/{spec_id}:
   *   delete:
   *     summary: Xóa thông số kỹ thuật
   */
  @Delete('assets/specifications/:spec_id')
  @ApiOperation({ summary: '8. Xóa thông số kỹ thuật' })
  async deleteSpecification(@Param('spec_id', ParseIntPipe) specId: number, @Req() req: any) {
    const data = await this.inKindService.deleteSpecification(specId);
    await this.trackAction(req, 'DELETE', `Xóa thông số kỹ thuật ID ${specId}`, 'ASSET_SPEC_DELETE');
    return { ...data };
  }

  /**
   * @swagger
   * /api/v1/assets/{asset_id}/attachments:
   *   post:
   *     summary: Upload tài liệu cho hiện vật
   *     consumes: [multipart/form-data]
   */
  @Post('assets/:asset_id/attachments')
  @ApiOperation({ summary: '9. Upload tài liệu cho hiện vật' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        doc_type: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['title', 'file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('asset_id', ParseIntPipe) assetId: number,
    @Body(new ZodValidationPipe(AssetAttachmentSchema)) body: AssetAttachmentDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('File is required');
    const data = await this.inKindService.uploadAttachment(assetId, body.title, body.doc_type || '', file);
    await this.trackAction(req, 'POST', `Upload tài liệu cho hiện vật ID ${assetId}: ${body.title}`, 'ASSET_ATTACH_UPLOAD');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/assets/attachments/{attachment_id}:
   *   delete:
   *     summary: Xóa tài liệu của hiện vật
   */
  @Delete('assets/attachments/:attachment_id')
  @ApiOperation({ summary: '10. Xóa tài liệu hiện vật' })
  async deleteAttachment(@Param('attachment_id', ParseIntPipe) attachmentId: number, @Req() req: any) {
    const data = await this.inKindService.deleteAttachment(attachmentId);
    await this.trackAction(req, 'DELETE', `Xóa tài liệu hiện vật ID ${attachmentId}`, 'ASSET_ATTACH_DELETE');
    return { ...data };
  }

  /**
   * @swagger
   * /api/v1/assets/attachments/{attachment_id}:
   *   get:
   *     summary: Xem/Tải tài liệu hiện vật
   */
  @Get('assets/attachments/:attachment_id')
  @ApiOperation({ summary: '10.1 Xem/Tải tài liệu hiện vật' })
  async downloadAttachment(@Param('attachment_id', ParseIntPipe) attachmentId: number, @Res() res: ExpressResponse) {
    const attachment = await this.inKindService.findAttachmentById(attachmentId);
    const fullPath = path.resolve(process.cwd(), attachment.path);
    return res.sendFile(fullPath);
  }

  /**
   * @swagger
   * /api/v1/programs/{program_id}/in-kind/handover-events:
   *   get:
   *     summary: Lấy danh sách sự kiện bàn giao (để chọn khi liên kết hiện vật)
   */
  @Get('programs/:program_id/in-kind/handover-events')
  @ApiOperation({ summary: '11. Danh sách sự kiện bàn giao' })
  async getHandoverEvents(@Param('program_id', ParseIntPipe) programId: number) {
    const data = await this.inKindService.getHandoverEvents(programId);
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/assets/{asset_id}/handover:
   *   patch:
   *     summary: Liên kết hiện vật với sự kiện bàn giao
   */
  @Patch('assets/:asset_id/handover')
  @ApiOperation({ summary: '12. Phân loại/Liên kết bàn giao' })
  async linkHandover(
    @Param('asset_id', ParseIntPipe) assetId: number,
    @Body(new ZodValidationPipe(LinkHandoverSchema)) body: LinkHandoverDto,
    @Req() req: any,
  ) {
    const data = await this.inKindService.linkHandover(assetId, body.handover_asset_id);
    await this.trackAction(req, 'PATCH', `Liên kết hiện vật ID ${assetId} với sự kiện bàn giao ID ${body.handover_asset_id}`, 'ASSET_HANDOVER_LINK');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/programs/{program_id}/handover-assets:
   *   get:
   *     summary: Danh sách các đợt bàn giao
   *     tags: [ASXH - In Kind]
   */
  @Get('programs/:program_id/handover-assets')
  @ApiOperation({ summary: '10. Danh sách các đợt bàn giao' })
  async getHandoverList(
    @Param('program_id', ParseIntPipe) programId: number,
    @Query(new ZodValidationPipe(HandoverListingQuerySchema)) query: HandoverListingQueryDto,
    @Req() req: any,
  ) {
    const data = await this.inKindService.getHandoverList(programId, query);
    await this.trackAction(req, 'GET', `Xem danh sách bàn giao chương trình ID ${programId}`, 'HANDOVER_LIST');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/programs/{program_id}/handover-assets/new-context:
   *   get:
   *     summary: Load dữ liệu khởi tạo màn “Lên lịch bàn giao”
   *     parameters:
   *       - name: program_id
   *         in: path
   *         required: true
   *         schema: { type: integer }
   */
  @Get('programs/:program_id/handover-assets/new-context')
  @ApiOperation({ summary: '13. Load dữ liệu khởi tạo màn Lên lịch bàn giao' })
  async getHandoverContext(
    @Param('program_id', ParseIntPipe) programId: number,
    @Query(new ZodValidationPipe(HandoverContextQuerySchema)) query: HandoverContextQueryDto,
    @Req() req: any,
  ) {
    const data = await this.inKindService.getHandoverContext(programId, query);
    await this.trackAction(req, 'GET', `Xem dữ liệu khởi tạo bàn giao chương trình ID ${programId}`, 'HANDOVER_CONTEXT');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/programs/{program_id}/handover-assets:
   *   post:
   *     summary: Tạo mới sự kiện bàn giao và gắn hiện vật
   */
  @Post('programs/:program_id/handover-assets')
  @ApiOperation({ summary: '14. Tạo mới sự kiện bàn giao' })
  async createHandoverBatch(
    @Param('program_id', ParseIntPipe) programId: number,
    @Body(new ZodValidationPipe(CreateHandoverSchema)) body: CreateHandoverDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    const data = await this.inKindService.createHandoverBatch(programId, body, userId);
    await this.trackAction(req, 'POST', `Tạo lịch bàn giao: ${body.event_name} cho chương trình ID ${programId}`, 'HANDOVER_CREATE');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/handover-assets/{id}:
   *   get:
   *     summary: Chi tiết lịch bàn giao
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema: { type: integer }
   */
  @Get('handover-assets/:id')
  @ApiOperation({ summary: '14b. Chi tiết lịch bàn giao' })
  async getHandoverDetail(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const data = await this.inKindService.getHandoverDetail(id);
    await this.trackAction(req, 'GET', `Xem chi tiết lịch bàn giao ID ${id}`, 'HANDOVER_DETAIL');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/handover-assets/{id}:
   *   put:
   *     summary: Cập nhật lịch bàn giao
   */
  @Put('handover-assets/:id')
  @ApiOperation({ summary: '14c. Cập nhật lịch bàn giao' })
  async updateHandoverBatch(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateHandoverSchema)) body: UpdateHandoverDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'System';
    const data = await this.inKindService.updateHandoverBatch(id, body, userId);
    await this.trackAction(req, 'PUT', `Cập nhật lịch bàn giao ID ${id}`, 'HANDOVER_UPDATE');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/handover-assets/{id}/save-draft:
   *   post:
   *     summary: Lưu nháp lịch bàn giao (ghi log)
   */
  @Post('handover-assets/:id/save-draft')
  @ApiOperation({ summary: '14e. Lưu nháp lịch bàn giao' })
  async saveDraft(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.userId || 'System';
    const data = await this.inKindService.saveHandoverDraft(id, userId);
    await this.trackAction(req, 'POST', `Bấm nút lưu nháp lịch bàn giao ID ${id}`, 'HANDOVER_SAVE_DRAFT');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/handover-assets/{id}/status:
   *   patch:
   *     summary: Cập nhật trạng thái lịch bàn giao
   */
  @Patch('handover-assets/:id/status')
  @ApiOperation({ summary: '14f. Cập nhật trạng thái lịch bàn giao' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateHandoverStatusSchema)) body: UpdateHandoverStatusDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'System';
    const data = await this.inKindService.updateHandoverStatus(id, body.status, userId);
    await this.trackAction(req, 'PATCH', `Cập nhật trạng thái lịch bàn giao ID ${id} -> ${body.status}`, 'HANDOVER_STATUS_UPDATE');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/handover-assets/{id}:
   *   delete:
   *     summary: Xóa lịch bàn giao (chỉ DRAFT)
   */
  @Delete('handover-assets/:id')
  @ApiOperation({ summary: '14d. Xóa lịch bàn giao' })
  async deleteHandoverBatch(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const data = await this.inKindService.deleteHandoverBatch(id);
    await this.trackAction(req, 'DELETE', `Xóa lịch bàn giao ID ${id}`, 'HANDOVER_DELETE');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/handover-checklists/{id}:
   *   patch:
   *     summary: Cập nhật trạng thái checklist
   */
  @Patch('handover-checklists/:id')
  @ApiOperation({ summary: '14e. Cập nhật trạng thái checklist' })
  async toggleHandoverChecklist(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(HandoverChecklistUpdateSchema)) body: { is_done: boolean },
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    const data = await this.inKindService.toggleHandoverChecklist(id, body.is_done, userId);
    await this.trackAction(req, 'PATCH', `Cập nhật checklist ID ${id}: ${body.is_done}`, 'HANDOVER_CHECKLIST_TOGGLE');
    return { success: true, data };
  }

  // --- SUPPLIER MANAGEMENT ---

  /**
   * @swagger
   * /api/v1/suppliers:
   *   get:
   *     summary: Danh sách nhà cung cấp
   *     tags: [ASXH - Suppliers]
   */
  @Get('suppliers')
  @ApiOperation({ summary: '15. Danh sách nhà cung cấp' })
  async getSuppliers(@Query(new ZodValidationPipe(SupplierListingQuerySchema)) query: SupplierListingQueryDto) {
    const data = await this.inKindService.getSuppliers(query);
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/suppliers/{id}:
   *   get:
   *     summary: Chi tiết nhà cung cấp
   *     tags: [ASXH - Suppliers]
   */
  @Get('suppliers/:id')
  @ApiOperation({ summary: '16. Chi tiết nhà cung cấp' })
  async getSupplierDetail(@Param('id', ParseIntPipe) id: number) {
    const data = await this.inKindService.getSupplierDetail(id);
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/suppliers:
   *   post:
   *     summary: Thêm mới nhà cung cấp
   *     tags: [ASXH - Suppliers]
   */
  @Post('suppliers')
  @ApiOperation({ summary: '17. Thêm mới nhà cung cấp' })
  async createSupplier(@Body(new ZodValidationPipe(CreateSupplierSchema)) body: CreateSupplierDto, @Req() req: any) {
    const data = await this.inKindService.createSupplier(body);
    await this.trackAction(req, 'POST', `Thêm mới nhà cung cấp: ${body.name}`, 'SUPPLIER_CREATE');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/suppliers/{id}:
   *   put:
   *     summary: Cập nhật nhà cung cấp
   *     tags: [ASXH - Suppliers]
   */
  @Put('suppliers/:id')
  @ApiOperation({ summary: '18. Cập nhật nhà cung cấp' })
  async updateSupplier(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(CreateSupplierSchema)) body: UpdateSupplierDto,
    @Req() req: any,
  ) {
    const data = await this.inKindService.updateSupplier(id, body);
    await this.trackAction(req, 'PUT', `Cập nhật nhà cung cấp ID ${id}`, 'SUPPLIER_UPDATE');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/suppliers/{id}:
   *   delete:
   *     summary: Xóa nhà cung cấp
   *     tags: [ASXH - Suppliers]
   */
  @Delete('suppliers/:id')
  @ApiOperation({ summary: '19. Xóa nhà cung cấp' })
  async deleteSupplier(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const data = await this.inKindService.deleteSupplier(id);
    await this.trackAction(req, 'DELETE', `Xóa nhà cung cấp ID ${id}`, 'SUPPLIER_DELETE');
    return { ...data };
  }

  // Audit Logging Helper
  private async trackAction(req: any, method: string, details: string, subType: string) {
    const userId = req.user?.userId;
    try {
      await this.systemLogService.createLogFromSystem({
        action: method,
        details: `ASXH IN-KIND: ${details}`,
        method: method,
        status: 'SUCCESS',
        type: 'ASXH',
        subType: subType,
        userInfo: userId || 'System',
        ipAddress: req?.ip || req?.connection?.remoteAddress || 'Unknown',
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to log action:', e);
    }
  }
  @Get('users/search')
  @ApiOperation({ summary: 'Tìm kiếm người dùng (cho chọn đoàn tham dự)' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng', type: UserSimpleResponseDto, isArray: true })
  async searchUsers(@Query(new ZodValidationPipe(UserSearchQuerySchema)) query: UserSearchQueryDto) {
    return await this.inKindService.searchUsers(query);
  }
}
