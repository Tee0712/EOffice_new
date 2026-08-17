import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UsePipes,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Header,
  Res,
  Req,
  ParseIntPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/oauth/jwt.guard';
import { AsxhService } from '../service/asxh.service';
import {
  DisbursementOverviewQuerySchema,
  DisbursementOverviewQueryDto,
  DisbursementTimelineQuerySchema,
  DisbursementTimelineQueryDto,
  UploadAttachmentSchema,
  UploadAttachmentDto,
  ConfirmSubmitSchema,
  ConfirmSubmitDto,
  SearchReceiversQuerySchema,
  SearchReceiversQueryDto,
  CreateReceiverSchema,
  CreateReceiverDto,
  BudgetCheckSchema,
  BudgetCheckDto,
  CreateDisbursementSchema,
  CreateDisbursementDto,
  UpdateDisbursementSchema,
  UpdateDisbursementDto,
  UpdateDisbursementStatusSchema,
  UpdateDisbursementStatusDto,
  ClassifyAttachmentSchema,
  ClassifyAttachmentDto,
} from '../dto/asxh.dto';
import { ZodValidationPipe } from '../dto/zod-validation.pipe';
import { SystemLogServiceSql } from 'src/systemLogManagement/system-log-service-sql';
import { Response } from 'express';


@ApiTags('ASXH - Giải ngân')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/v1')
export class AsxhController {
  constructor(
    private readonly asxhService: AsxhService,
    private readonly systemLogService: SystemLogServiceSql,
  ) { }

  /**
   * @swagger
   * /api/v1/disbursements/statuses:
   *   get:
   *     summary: Lấy danh sách trạng thái đợt giải ngân
   *     tags: [ASXH]
   *     responses:
   *       200:
   *         description: Thành công
   */
  @Get('disbursements/statuses')
  @ApiOperation({ summary: '13.1 Tra cứu danh sách trạng thái đợt giải ngân' })
  async getStatuses() {
    return {
      success: true,
      data: await this.asxhService.getStatuses(),
    };
  }

  /**
   * @swagger
   * /api/v1/programs/{program_id}/disbursements/overview:
   *   get:
   *     summary: Tra cứu tổng quan giải ngân theo chương trình
   *     parameters:
   *       - name: program_id
   *         in: path
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Thành công
   */
  @Get('programs/:program_id/disbursements/overview')
  @ApiOperation({ summary: '1.1 Tra cứu tổng quan giải ngân theo chương trình' })
  async getOverview(
    @Param('program_id', ParseIntPipe) programId: number,
    @Query(new ZodValidationPipe(DisbursementOverviewQuerySchema)) query: DisbursementOverviewQueryDto,
    @Req() req: any,
  ) {
    const data = await this.asxhService.getOverview(programId, query);
    await this.trackAction(req, 'GET', `Xem tổng quan giải ngân chương trình ID ${programId}`, 'PROGRAM_OVERVIEW');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/programs/{program_id}/disbursements/export:
   *   get:
   *     summary: Xuất file Excel danh sách đợt giải ngân
   *     parameters:
   *       - name: program_id
   *         in: path
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Thành công
   */
  @Get('programs/:program_id/disbursements/export')
  @ApiOperation({ summary: '1.3 Xuất file Excel danh sách đợt giải ngân' })
  async exportDisbursements(
    @Param('program_id', ParseIntPipe) programId: number,
    @Query(new ZodValidationPipe(DisbursementOverviewQuerySchema)) query: DisbursementOverviewQueryDto,
    @Res() res: Response,
    @Req() req: any,
  ) {
    const buffer = await this.asxhService.exportDisbursements(programId, query);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=Danh_sach_giai_ngan_${programId}.xlsx`,
      'Content-Length': (buffer as any).length,
    });

    await this.trackAction(req, 'GET', `Xuất Excel danh sách giải ngân chương trình ID ${programId}`, 'DISBURSEMENT_EXPORT');

    res.end(buffer);
  }

  /**
   * @swagger
   * /api/v1/disbursements/{disbursement_id}:
   *   get:
   *     summary: Lấy chi tiết đợt giải ngân
   *     parameters:
   *       - name: disbursement_id
   *         in: path
   *         required: true
   *         schema: { type: integer }
   */
  @Get('disbursements/:disbursement_id')
  @ApiOperation({ summary: '2.1 Lấy chi tiết đợt giải ngân' })
  async getDetail(@Param('disbursement_id', ParseIntPipe) disbursementId: number, @Req() req: any) {
    const data = await this.asxhService.getDetail(disbursementId);
    await this.trackAction(req, 'GET', `Xem chi tiết đợt giải ngân ID ${disbursementId}`, 'DISBURSEMENT_DETAIL');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/programs/{program_id}/disbursements/timeline:
   *   get:
   *     summary: Lấy timeline theo chương trình
   *     parameters:
   *       - name: program_id
   *         in: path
   *         required: true
   *         schema: { type: integer }
   */
  @Get('programs/:program_id/disbursements/timeline')
  @ApiOperation({ summary: '3.1 Lấy timeline theo chương trình' })
  async getTimeline(
    @Param('program_id', ParseIntPipe) programId: number,
    @Query(new ZodValidationPipe(DisbursementTimelineQuerySchema)) query: DisbursementTimelineQueryDto,
    @Req() req: any,
  ) {
    const data = await this.asxhService.getTimeline(programId, query);
    await this.trackAction(req, 'GET', `Xem timeline giải ngân chương trình ID ${programId}`, 'PROGRAM_TIMELINE');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/disbursements/{disbursement_id}/attachments:
   *   post:
   *     summary: Upload chứng từ cho đợt giải ngân
   *     consumes: [multipart/form-data]
   */
  @Post('disbursements/:disbursement_id/attachments')
  @ApiOperation({ summary: '4.1 Upload chứng từ cho đợt giải ngân (Nhiều file)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
        },
        doc_type: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['title', 'files'],
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadAttachments(
    @Param('disbursement_id', ParseIntPipe) disbursementId: number,
    @Body(new ZodValidationPipe(UploadAttachmentSchema)) body: UploadAttachmentDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: any,
  ) {
    if (!files || files.length === 0) throw new BadRequestException('At least one file is required');
    const data = await this.asxhService.uploadAttachments(disbursementId, body.title, files, body.doc_type);
    await this.trackAction(req, 'POST', `Upload ${files.length} chứng từ cho đợt giải ngân ID ${disbursementId}`, 'ATTACHMENT_UPLOAD');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/disbursements/{disbursement_id}/attachments/{attachment_id}:
   *   delete:
   *     summary: Xóa chứng từ của đợt giải ngân
   */
  @Delete('disbursements/:disbursement_id/attachments/:attachment_id')
  @ApiOperation({ summary: '5.1 Xóa chứng từ của đợt giải ngân' })
  async deleteAttachment(
    @Param('disbursement_id', ParseIntPipe) disbursementId: number,
    @Param('attachment_id', ParseIntPipe) attachmentId: number,
    @Req() req: any,
  ) {
    const data = await this.asxhService.deleteAttachment(disbursementId, attachmentId);
    await this.trackAction(req, 'DELETE', `Xóa chứng từ ID ${attachmentId}`, 'ATTACHMENT_DELETE');
    return { ...data };
  }

  /**
   * @swagger
   * /api/v1/disbursements/{disbursement_id}/confirm-submit:
   *   post:
   *     summary: Xác nhận và gửi phê duyệt đợt giải ngân
   */
  @Post('disbursements/:disbursement_id/confirm-submit')
  @ApiOperation({ summary: '7.1 Xác nhận và gửi phê duyệt đợt giải ngân' })
  async confirmSubmit(
    @Param('disbursement_id', ParseIntPipe) disbursementId: number,
    @Body(new ZodValidationPipe(ConfirmSubmitSchema)) body: ConfirmSubmitDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'System';
    const data = await this.asxhService.confirmSubmit(disbursementId, body, userId);
    await this.trackAction(req, 'POST', `Xác nhận và gửi phê duyệt đợt giải ngân ID ${disbursementId}`, 'CONFIRM_SUBMIT');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/disbursement-attachments/{attachment_id}/download:
   *   get:
   *     summary: Download/Preview attachment
   */
  @Get('disbursement-attachments/:attachment_id/download')
  @ApiOperation({ summary: '6.1 Download/Preview attachment' })
  async downloadAttachment(@Param('attachment_id', ParseIntPipe) attachmentId: number, @Res() res: Response) {
    const { path: filePath, name } = await this.asxhService.getAttachmentFile(attachmentId);
    res.download(filePath, name);
  }

  /**
   * @swagger
   * /api/v1/programs/{program_id}/disbursements/new-context:
   *   get:
   *     summary: Tải dữ liệu khởi tạo màn tạo đợt giải ngân mới
   */
  @Get('programs/:program_id/disbursements/new-context')
  @ApiOperation({ summary: '1.2 Load dữ liệu khởi tạo màn Tạo đợt giải ngân mới' })
  async getNewContext(@Param('program_id', ParseIntPipe) programId: number, @Req() req: any) {
    const data = await this.asxhService.getNewContext(programId);
    await this.trackAction(req, 'GET', `Xem ngữ cảnh tạo mới giải ngân chương trình ID ${programId}`, 'NEW_CONTEXT');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/programs/{program_id}/disbursements/next-code:
   *   get:
   *     summary: Preview mã đợt giải ngân mới
   */
  @Get('programs/:program_id/disbursements/next-code')
  @ApiOperation({ summary: '2.2 Preview mã đợt giải ngân mới' })
  async getNextCode(@Param('program_id', ParseIntPipe) programId: number, @Req() req: any) {
    const data = await this.asxhService.getNextCode(programId);
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/disbursement-receivers:
   *   get:
   *     summary: Tra cứu danh sách đơn vị nhận tiền
   */
  @Get('disbursement-receivers')
  @ApiOperation({ summary: '3.2 Tra cứu danh sách đơn vị nhận tiền' })
  async searchReceivers(@Query(new ZodValidationPipe(SearchReceiversQuerySchema)) query: SearchReceiversQueryDto) {
    const data = await this.asxhService.searchReceivers(query);
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/disbursement-receivers:
   *   post:
   *     summary: Tạo mới đơn vị nhận tiền
   */
  @Post('disbursement-receivers')
  @ApiOperation({ summary: '4.2 Tạo mới đơn vị nhận tiền' })
  async createReceiver(@Body(new ZodValidationPipe(CreateReceiverSchema)) body: CreateReceiverDto, @Req() req: any) {
    const data = await this.asxhService.createReceiver(body);
    await this.trackAction(req, 'POST', `Tạo đơn vị nhận tiền mới: ${body.name}`, 'RECEIVER_CREATE');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/program-items/{program_item_id}/disbursements/budget-check:
   *   post:
   *     summary: Kiểm tra ngân sách realtime theo hạng mục
   */
  @Post('program-items/:program_item_id/disbursements/budget-check')
  @ApiOperation({ summary: '5.2 Kiểm tra ngân sách realtime theo hạng mục' })
  async checkBudget(
    @Param('program_item_id', ParseIntPipe) programItemId: number,
    @Body(new ZodValidationPipe(BudgetCheckSchema)) body: BudgetCheckDto,
  ) {
    const data = await this.asxhService.checkBudget(programItemId, body);
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/programs/{program_id}/disbursements:
   *   post:
   *     summary: Tạo đợt giải ngân mới (Lưu nháp)
   */
  @Post('programs/:program_id/disbursements')
  @ApiOperation({ summary: '6.2 Tạo đợt giải ngân mới (Lưu nháp)' })
  async createDisbursement(
    @Param('program_id', ParseIntPipe) programId: number,
    @Body(new ZodValidationPipe(CreateDisbursementSchema)) body: CreateDisbursementDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'System';
    const data = await this.asxhService.createDisbursement(programId, body, userId);
    await this.trackAction(req, 'POST', `Tạo mới đợt giải ngân (DRAFT) cho chương trình ${programId}`, 'DISBURSEMENT_CREATE');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/disbursements/{disbursement_id}:
   *   put:
   *     summary: Cập nhật đợt giải ngân (DRAFT)
   */
  @Put('disbursements/:disbursement_id')
  @ApiOperation({ summary: '7.2 Cập nhật đợt giải ngân (DRAFT)' })
  async updateDisbursement(
    @Param('disbursement_id', ParseIntPipe) disbursementId: number,
    @Body(new ZodValidationPipe(UpdateDisbursementSchema)) body: UpdateDisbursementDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'System';
    const data = await this.asxhService.updateDisbursement(disbursementId, body, userId);
    await this.trackAction(req, 'PUT', `Cập nhật đợt giải ngân ID ${disbursementId}`, 'DISBURSEMENT_UPDATE');
    return { success: true, data };
  }


  /**
   * @swagger
   * /api/v1/disbursement-attachments/{attachment_id}/classify:
   *   patch:
   *     summary: Phân loại chứng từ (badge)
   */
  @Post('disbursement-attachments/:attachment_id/classify')
  @ApiOperation({ summary: '10.2 Phân loại chứng từ' })
  async classifyAttachment(
    @Param('attachment_id', ParseIntPipe) attachmentId: number,
    @Body(new ZodValidationPipe(ClassifyAttachmentSchema)) body: ClassifyAttachmentDto,
    @Req() req: any,
  ) {
    const data = await this.asxhService.classifyAttachment(attachmentId, body.doc_type);
    await this.trackAction(req, 'PATCH', `Phân loại lại chứng từ ID ${attachmentId} thành ${body.doc_type}`, 'ATTACHMENT_CLASSIFY');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/disbursements/{disbursement_id}/save-draft:
   *   post:
   *     summary: Lưu nháp (ghi log)
   */
  @Post('disbursements/:disbursement_id/save-draft')
  @ApiOperation({ summary: '12.2 Lưu nháp và ghi log' })
  async saveDraft(@Param('disbursement_id', ParseIntPipe) disbursementId: number, @Req() req: any) {
    const userId = req.user?.userId || 'System';
    const data = await this.asxhService.saveDraft(disbursementId, userId);
    await this.trackAction(req, 'POST', `Bấm nút lưu nháp đợt giải ngân ID ${disbursementId}`, 'SAVE_DRAFT');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/disbursements/{disbursement_id}/status:
   *   patch:
   *     summary: Thay đổi trạng thái đợt giải ngân
   */
  @Post('disbursements/:disbursement_id/status')
  @Patch('disbursements/:disbursement_id/status')
  @ApiOperation({ summary: '8.2 Thay đổi trạng thái đợt giải ngân' })
  async updateStatus(
    @Param('disbursement_id', ParseIntPipe) disbursementId: number,
    @Body(new ZodValidationPipe(UpdateDisbursementStatusSchema)) body: UpdateDisbursementStatusDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'System';
    const data = await this.asxhService.updateStatus(disbursementId, body, userId);
    await this.trackAction(req, 'POST', `Thay đổi trạng thái đợt giải ngân ID ${disbursementId} thành ${body.status}`, 'STATUS_UPDATE');
    return { success: true, data };
  }

  /**
   * @swagger
   * /api/v1/disbursements/{disbursement_id}:
   *   delete:
   *     summary: Xóa đợt giải ngân (Chỉ trạng thái DRAFT)
   *     parameters:
   *       - name: disbursement_id
   *         in: path
   *         required: true
   *         schema: { type: integer }
   */
  @Delete('disbursements/:disbursement_id')
  @ApiOperation({ summary: '14.2 Xóa đợt giải ngân' })
  async deleteDisbursement(@Param('disbursement_id', ParseIntPipe) disbursementId: number, @Req() req: any) {
    const data = await this.asxhService.deleteDisbursement(disbursementId);
    await this.trackAction(req, 'DELETE', `Xóa đợt giải ngân ID ${disbursementId}`, 'DISBURSEMENT_DELETE');
    return { ...data };
  }

  // Helper cho Audit Logging

  private async trackAction(req: any, method: string, details: string, subType: string) {
    const userId = req.user?.userId;
    try {
      await this.systemLogService.createLogFromSystem({
        action: method,
        details: `ASXH: ${details}`,
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
}
