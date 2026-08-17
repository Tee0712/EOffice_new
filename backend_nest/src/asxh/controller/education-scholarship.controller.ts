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
  Req,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/oauth/jwt.guard';
import { EducationScholarshipService } from '../service/education-scholarship.service';
import {
  UniversityPartnerListingQuerySchema,
  UniversityPartnerListingQueryDto,
  CreateUniversityPartnerSchema,
  CreateUniversityPartnerDto,
  UpdateUniversityPartnerSchema,
  UpdateUniversityPartnerDto,
  ScholarshipCandidateListingQuerySchema,
  ScholarshipCandidateListingQueryDto,
  CreateScholarshipCandidateSchema,
  CreateScholarshipCandidateDto,
  UpdateScholarshipCandidateSchema,
  UpdateScholarshipCandidateDto,
  CandidateStatusUpdateSchema,
  CandidateStatusUpdateDto,
  EducationScholarshipOverviewDto,
  UploadPartnerAttachmentSchema,
  UploadPartnerAttachmentDto,
  UploadCandidateAttachmentSchema,
  UploadCandidateAttachmentDto,
} from '../dto/education-scholarship.dto';
import { ZodValidationPipe } from '../dto/zod-validation.pipe';
import { SystemLogServiceSql } from 'src/systemLogManagement/system-log-service-sql';

@ApiTags('ASXH - Tai tro Giao duc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/education-scholarships')
export class EducationScholarshipController {
  constructor(
    private readonly scholarshipService: EducationScholarshipService,
    private readonly systemLogService: SystemLogServiceSql,
  ) {
    console.log('🚀 EducationScholarshipController initialized');
  }

  private async trackAction(req: any, method: string, details: string, subType: string) {
    const userId = req.user?.userId;
    try {
      await this.systemLogService.createLogFromSystem({
        action: method,
        details: `ASXH EDU-SCHOLARSHIP: ${details}`,
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

  @Get('overview')
  @ApiOperation({ summary: '1. Tổng quan Tài trợ Giáo dục & Học bổng' })
  @ApiResponse({ status: 200, type: EducationScholarshipOverviewDto })
  async getOverview(@Query('school_year') schoolYear: string, @Req() req: any) {
    const data = await this.scholarshipService.getOverview(schoolYear);
    return { success: true, data };
  }

  // --- UNIVERSITY PARTNERS ---

  @Get('partners')
  @ApiOperation({ summary: '2. Danh sách đối tác đại học' })
  async findPartners(
    @Query(new ZodValidationPipe(UniversityPartnerListingQuerySchema)) query: UniversityPartnerListingQueryDto,
  ) {
    const data = await this.scholarshipService.findPartners(query);
    return { success: true, data };
  }

  @Get('schools')
  @ApiOperation({ summary: '2b. Danh sách trường hợp tác (Phân trang)' })
  async findSchools(
    @Query(new ZodValidationPipe(UniversityPartnerListingQuerySchema)) query: UniversityPartnerListingQueryDto,
  ) {
    const data = await this.scholarshipService.findPartners(query);
    return { success: true, data };
  }

  @Get('partners/:id')
  @ApiOperation({ summary: '3. Chi tiết đối tác đại học' })
  async findPartnerById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.scholarshipService.findPartnerById(id);
    return { success: true, data };
  }

  @Post('partners')
  @ApiOperation({ summary: '4. Tạo mới đối tác đại học' })
  async createPartner(
    @Body(new ZodValidationPipe(CreateUniversityPartnerSchema)) body: CreateUniversityPartnerDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const data = await this.scholarshipService.createPartner(body, userId);
    await this.trackAction(req, 'POST', `Tạo mới đối tác: ${body.name}`, 'PARTNER_CREATE');
    return { success: true, data };
  }

  @Put('partners/:id')
  @ApiOperation({ summary: '5. Cập nhật đối tác đại học' })
  async updatePartner(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateUniversityPartnerSchema)) body: UpdateUniversityPartnerDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const data = await this.scholarshipService.updatePartner(id, body, userId);
    await this.trackAction(req, 'PUT', `Cập nhật đối tác ID ${id}: ${body.name}`, 'PARTNER_UPDATE');
    return { success: true, data };
  }

  @Delete('partners/:id')
  @ApiOperation({ summary: '6. Xóa đối tác đại học (Xóa vĩnh viễn dữ liệu liên quan)' })
  async deletePartner(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const data = await this.scholarshipService.deletePartner(id);
    await this.trackAction(req, 'DELETE', `Xóa vĩnh viễn đối tác ID ${id}`, 'PARTNER_DELETE');
    return { success: true, data };
  }

  @Patch('partners/:id/status')
  @ApiOperation({ summary: '6d. Thay đổi trạng thái Hoạt động/Tạm dừng của đối tác' })
  async updatePartnerStatus(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.id;
    const data = await this.scholarshipService.togglePartnerStatus(id, userId);
    await this.trackAction(req, 'PATCH', `Thay đổi trạng thái đối tác ID ${id} sang ${data.status}`, 'PARTNER_STATUS_TOGGLE');
    return { success: true, data };
  }

  @Post('partners/:id/logo')
  @ApiOperation({ summary: '6a. Upload logo đối tác' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPartnerLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('File is required');
    const data = await this.scholarshipService.uploadPartnerLogo(id, file);
    await this.trackAction(req, 'POST', `Upload logo cho đối tác ID ${id}`, 'PARTNER_LOGO_UPLOAD');
    return { success: true, data };
  }

  @Post('partners/:id/attachments')
  @ApiOperation({ summary: '6b. Upload tài liệu đối tác' })
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
  async uploadPartnerAttachment(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UploadPartnerAttachmentSchema)) body: UploadPartnerAttachmentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(pdf|png|jpeg|jpg)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('File is required');
    const userId = req.user?.id;
    const data = await this.scholarshipService.uploadPartnerAttachment(id, body.title, body.doc_type || '', file, userId);
    await this.trackAction(req, 'POST', `Upload tài liệu cho đối tác ID ${id}: ${body.title}`, 'PARTNER_ATTACH_UPLOAD');
    return { success: true, data };
  }

  @Delete('partners/attachments/:attachment_id')
  @ApiOperation({ summary: '6c. Xóa tài liệu đối tác' })
  async deletePartnerAttachment(@Param('attachment_id', ParseIntPipe) attachmentId: number, @Req() req: any) {
    const data = await this.scholarshipService.deletePartnerAttachment(attachmentId);
    await this.trackAction(req, 'DELETE', `Xóa tài liệu đối tác ID ${attachmentId}`, 'PARTNER_ATTACH_DELETE');
    return { success: true, data };
  }

  // --- SCHOLARSHIP CANDIDATES ---

  @Get('candidates')
  @ApiOperation({ summary: '7. Danh sách ứng viên học bổng' })
  async findCandidates(
    @Query(new ZodValidationPipe(ScholarshipCandidateListingQuerySchema)) query: ScholarshipCandidateListingQueryDto,
  ) {
    const data = await this.scholarshipService.findCandidates(query);
    return { success: true, data };
  }

  @Get('candidates/preview-code')
  @ApiOperation({ summary: '8. Xem trước mã hồ sơ ứng viên' })
  async previewCandidateCode() {
    const code = await this.scholarshipService.previewCandidateCode();
    return { success: true, data: { code } };
  }

  @Get('candidates/:id')
  @ApiOperation({ summary: '9. Chi tiết ứng viên học bổng' })
  async getCandidateDetail(@Param('id', ParseIntPipe) id: number) {
    const data = await this.scholarshipService.getCandidateDetail(id);
    return { success: true, data };
  }

  @Post('candidates')
  @ApiOperation({ summary: '10. Tạo mới hồ sơ ứng viên' })
  async createCandidate(
    @Body(new ZodValidationPipe(CreateScholarshipCandidateSchema)) body: CreateScholarshipCandidateDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const data = await this.scholarshipService.createCandidate(body, userId);
    await this.trackAction(req, 'POST', `Tạo mới ứng viên: ${body.full_name}`, 'CANDIDATE_CREATE');
    return { success: true, data };
  }

  @Put('candidates/:id')
  @ApiOperation({ summary: '11. Cập nhật hồ sơ ứng viên' })
  async updateCandidate(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateScholarshipCandidateSchema)) body: UpdateScholarshipCandidateDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const data = await this.scholarshipService.updateCandidate(id, body, userId);
    await this.trackAction(req, 'PUT', `Cập nhật ứng viên ID ${id}: ${body.full_name}`, 'CANDIDATE_UPDATE');
    return { success: true, data };
  }

  @Patch('candidates/:id/status')
  @ApiOperation({ summary: '12. Cập nhật trạng thái ứng viên' })
  async updateCandidateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(CandidateStatusUpdateSchema)) body: CandidateStatusUpdateDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const data = await this.scholarshipService.updateCandidateStatus(id, body.status, userId);
    await this.trackAction(req, 'PATCH', `Cập nhật trạng thái ứng viên ID ${id} -> ${body.status}`, 'CANDIDATE_STATUS_UPDATE');
    return { success: true, data };
  }

  @Delete('candidates/:id')
  @ApiOperation({ summary: '13. Xóa hồ sơ ứng viên' })
  async deleteCandidate(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const data = await this.scholarshipService.deleteCandidate(id);
    await this.trackAction(req, 'DELETE', `Xóa ứng viên ID ${id}`, 'CANDIDATE_DELETE');
    return { success: true, data };
  }

  @Post('candidates/:id/avatar')
  @ApiOperation({ summary: '14. Upload avatar ứng viên' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCandidateAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('File is required');
    const data = await this.scholarshipService.uploadCandidateAvatar(id, file);
    await this.trackAction(req, 'POST', `Upload avatar cho ứng viên ID ${id}`, 'CANDIDATE_AVATAR_UPLOAD');
    return { success: true, data };
  }

  @Post('candidates/:id/attachments')
  @ApiOperation({ summary: '15. Upload tài liệu hồ sơ ứng viên' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        doc_type: { type: 'string' },
        is_required: { type: 'boolean' },
        status: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['title', 'file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCandidateAttachment(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UploadCandidateAttachmentSchema)) body: UploadCandidateAttachmentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(pdf|png|jpeg|jpg)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('File is required');
    const userId = req.user?.id;
    const data = await this.scholarshipService.uploadCandidateAttachment(id, body.title, body.doc_type || '', body.is_required || false, body.status || 'DRAFT', file, userId);
    await this.trackAction(req, 'POST', `Upload tài liệu cho ứng viên ID ${id}: ${body.title}`, 'CANDIDATE_ATTACH_UPLOAD');
    return { success: true, data };
  }

  @Delete('candidates/attachments/:attachment_id')
  @ApiOperation({ summary: '16. Xóa tài liệu hồ sơ ứng viên' })
  async deleteCandidateAttachment(@Param('attachment_id', ParseIntPipe) attachmentId: number, @Req() req: any) {
    const data = await this.scholarshipService.deleteCandidateAttachment(attachmentId);
    await this.trackAction(req, 'DELETE', `Xóa tài liệu ứng viên ID ${attachmentId}`, 'CANDIDATE_ATTACH_DELETE');
    return { success: true, data };
  }

  @Get('export')
  @ApiOperation({ summary: '17. Xuất báo cáo Excel' })
  async exportReport(
    @Query('school_year') schoolYear: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    if (!schoolYear) throw new BadRequestException('school_year query parameter is required');
    const { buffer, filename } = await this.scholarshipService.exportToExcel(schoolYear, req.user?.id);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=${encodeURIComponent(filename)}`,
      'Content-Length': buffer.length,
    });
    
    res.end(buffer);
  }
}
