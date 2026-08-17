import {
  Controller, Get, Post, Patch, Put, Delete, Body, Query, Param, UseGuards,
  UploadedFile, UseInterceptors, ParseIntPipe, Req, Res, NotFoundException, UsePipes, ValidationPipe, BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/oauth/jwt.guard';
import { VppCatalogService } from '../service/vpp-catalog.service';
import { VppInventoryService } from '../service/vpp-inventory.service';
import { CatalogFilterDto, CreateProductDto, UpdateProductDto } from '../dto/catalog.dto';
import { InventoryFilterDto, ImportInventoryDto, CreateIssueRequestDto, GoodsIssueFilterDto, ConfirmIssueDto } from '../dto/inventory.dto';
import { VppUserGuard } from '../guards/vpp-user.guard';
import { VppAdminGuard } from '../guards/vpp-admin.guard';

const strictBodyValidationPipe = new ValidationPipe({
  transform: true,
  skipMissingProperties: false,
  whitelist: true,
  exceptionFactory: (errors) => {
    const formattedErrors = errors.map((err) => {
      let message: any = [];
      if (err.constraints) {
        const val = Object.values(err.constraints)[0];
        try {
          message = JSON.parse(val);
        } catch {
          message = val;
        }
      }
      return { field: err.property, message };
    });

    return new BadRequestException({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: formattedErrors,
    });
  },
});

@ApiTags('Quản lý danh mục & Kho VPP')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VppUserGuard)
@Controller('v1/vpp')
export class VppController {
  constructor(
    private readonly catalogService: VppCatalogService,
    private readonly inventoryService: VppInventoryService,
  ) { }

  // --- TEST ---
  @Get('test')
  test() {
    // Không mở endpoint test trên môi trường production
    if ((process.env.NODE_ENV || '').toLowerCase() === 'production') {
      throw new NotFoundException();
    }
    return { message: 'VppController is working' };
  }

  // --- CATALOG ---

  @Get('catalog-items')
  @ApiOperation({ summary: 'Tra cứu danh mục VPP' })
  findAllCatalog(@Query() filter: CatalogFilterDto, @Req() req) {
    return this.catalogService.findAll(filter, req.user.userId || req.user.user);
  }

  @Get('catalog/search')
  @ApiOperation({ summary: 'Tìm kiếm nhanh mặt hàng theo tên hoặc mã' })
  searchCatalog(@Query('keyword') keyword: string) {
    return this.catalogService.search(keyword);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Danh sách nhóm hàng (distinct)' })
  getCategories() {
    return this.catalogService.getCategories();
  }

  @Post('upload-base64')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Upload file base64 trả về URL' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { base64: { type: 'string', description: 'Chuỗi base64 của file/ảnh' } },
    },
  })
  async uploadBase64(@Body('base64') base64: string, @Req() req) {
    const url = await this.catalogService.uploadBase64(base64, req.user.userId || req.user.user);
    return { url };
  }

  @Get('catalog-items/:id')
  @ApiOperation({ summary: 'Chi tiết mặt hàng VPP' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.findOne(id);
  }

  @Post('catalog-items')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Tạo mặt hàng VPP' })
  createProduct(@Body() dto: CreateProductDto, @Req() req) {
    return this.catalogService.create(dto, req.user.userId || req.user.user);
  }

  @Patch('catalog-items/:id')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Sửa mặt hàng VPP' })
  updateProduct(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto, @Req() req) {
    return this.catalogService.update(id, dto, req.user.userId || req.user.user);
  }

  @Put('catalog-items/:id/status')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Ẩn / Hiện mặt hàng VPP' })
  setStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string, @Req() req) {
    return this.catalogService.setStatus(id, status, req.user.userId || req.user.user);
  }

  @Delete('catalog-items/:id')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Xóa vật lý mặt hàng VPP' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.catalogService.remove(id, req.user.userId || req.user.user);
  }

  // --- INVENTORY ---

  // --- MÀN 3: TẠO PHIẾU ĐỀ NGHỊ ---

  @Get('request/info')
  @ApiOperation({ summary: 'Lấy thông tin người đề nghị và phòng ban' })
  getRequestorInfo(@Req() req) {
    return this.inventoryService.getRequestorInfo(req.user.userId || req.user.user);
  }

  @Get('inventory/picker')
  @ApiOperation({ summary: 'Lấy danh mục sản phẩm kèm định mức và tồn kho (Cho Picker)' })
  getInventoryForPicker(@Query() filter: any, @Req() req) {
    return this.inventoryService.getInventoryForPicker(req.user.userId || req.user.user, filter);
  }

  @Get('product-limits/check')
  @ApiOperation({ summary: 'Kiểm tra định mức sử dụng VPP' })
  checkProductLimit(@Query('product_ids') productIds: string, @Req() req) {
    return this.inventoryService.checkLimit(productIds, req.user.userId || req.user.user);
  }

  @Post('inventory-transactions')
  @ApiOperation({ summary: 'Tạo phiếu đề nghị cấp VPP' })
  createIssueRequest(@Body() dto: CreateIssueRequestDto, @Req() req) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    return this.inventoryService.createIssueRequest(dto, req.user.userId || req.user.user, ip, req.originalUrl);
  }

  // --- INVENTORY ---

  @Get('inventory')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Tra cứu tồn kho VPP' })
  findInventory(@Query() filter: InventoryFilterDto) {
    return this.inventoryService.findInventory(filter);
  }

  @Get('inventory/export')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Xuất file Excel tồn kho' })
  async exportInventory(@Query() filter: InventoryFilterDto, @Res() res: any) {
    const buffer = await this.inventoryService.exportExcel(filter);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Inventory.xlsx');
    return res.end(buffer);
  }

  @Get('inventory/:productId')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Chi tiết tồn kho và lịch sử giao dịch' })
  getInventoryDetail(@Param('productId', ParseIntPipe) productId: number) {
    return this.inventoryService.getDetail(productId);
  }

  @Post('inventory/import')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Nhập kho VPP' })
  @UsePipes(strictBodyValidationPipe)
  importStock(@Body() dto: ImportInventoryDto, @Req() req) {
    return this.inventoryService.importStock(dto, req.user.userId || req.user.user);
  }

  // --- MÀN 4: DANH SÁCH PHIẾU ĐỀ NGHỊ ---

  @Get('goods-issues/departments')
  @ApiOperation({ summary: 'Lấy danh sách các phòng ban đã từng đề nghị cấp VPP (Dùng cho filter)' })
  getGoodsIssueDepartments(@Req() req) {
    return this.inventoryService.getGoodsIssueDepartments(req.user.userId || req.user.user);
  }

  @Get('goods-issues')
  @ApiOperation({ summary: 'Danh sách phiếu đề nghị cấp VPP' })
  getGoodsIssues(@Query() filter: GoodsIssueFilterDto, @Req() req) {
    return this.inventoryService.getGoodsIssues(filter, req.user.userId || req.user.user);
  }

  @Get('goods-issues/export')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Xuất file Excel danh sách phiếu đề nghị' })
  async exportGoodsIssues(@Query() filter: GoodsIssueFilterDto, @Req() req, @Res() res: any) {
    const buffer = await this.inventoryService.exportGoodsIssuesExcel(filter, req.user.userId || req.user.user);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=VPP_Requests.xlsx');
    return res.end(buffer);
  }

  @Get('distribution/export')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Xuất file báo cáo cấp phát' })
  async exportDistribution(@Query() filter: GoodsIssueFilterDto, @Req() req, @Res() res: any) {
    const buffer = await this.inventoryService.exportDistributionExcel(filter, req.user.userId || req.user.user);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=VPP_Distribution_PickList.xlsx');
    return res.end(buffer);
  }

  @Get('goods-issues/:id')
  @ApiOperation({ summary: 'Lấy chi tiết phiếu đề nghị cấp VPP' })
  getGoodsIssueDetail(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.getGoodsIssueDetail(id);
  }

  @Post('goods-issues/:id/confirm')
  @UseGuards(VppUserGuard)
  @ApiOperation({ summary: 'Xác nhận cấp phát hoàn tất' })
  @UsePipes(strictBodyValidationPipe)
  confirmIssue(@Param('id', ParseIntPipe) id: number, @Body() dto: ConfirmIssueDto, @Req() req) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    return this.inventoryService.confirmIssue({ ...dto, transaction_id: id }, req.user.userId || req.user.user, ip, req.originalUrl);
  }

  @Post('inventory-transactions/:id/approve')
  @ApiOperation({ summary: 'Phê duyệt phiếu đề nghị' })
  approveRequest(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const role = req.user.role || 'staff';
    return this.inventoryService.approveRequest(id, dto, req.user.userId || req.user.user, role, ip, req.originalUrl);
  }

  @Post('inventory-transactions/:id/reject')
  @ApiOperation({ summary: 'Từ chối phiếu đề nghị' })
  rejectRequest(@Param('id', ParseIntPipe) id: number, @Body() dto: { note: string }, @Req() req) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const role = req.user.role || 'staff';
    return this.inventoryService.rejectRequest(id, dto, req.user.userId || req.user.user, role, ip, req.originalUrl);
  }

  @Post('inventory-transactions/:id/escalate')
  @ApiOperation({ summary: 'Chuyển xử lý cấp trên' })
  escalateRequest(@Param('id', ParseIntPipe) id: number, @Body() dto: { note?: string }, @Req() req) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const role = req.user.role || 'staff';
    return this.inventoryService.escalateRequest(id, dto, req.user.userId || req.user.user, role, ip, req.originalUrl);
  }

  @Patch('inventory-transactions/:id')
  @ApiOperation({ summary: 'Gửi lại phiếu đề nghị cấp VPP (Dùng cho Edit/Resubmit)' })
  resubmitRequest(@Param('id', ParseIntPipe) id: number, @Body() dto: any, @Req() req) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    return this.inventoryService.resubmitRequest(id, dto, req.user.userId || req.user.user, ip, req.originalUrl);
  }

  @Delete('inventory-transactions/:id')
  @ApiOperation({ summary: 'Xóa phiếu đề nghị (Chỉ khi ở trạng thái Draft)' })
  deleteIssueRequest(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    return this.inventoryService.deleteIssueRequest(id, req.user.userId || req.user.user, ip, req.originalUrl);
  }


  // --- EXCEL ---

  @Post('catalog-items/import')
  @UseGuards(VppAdminGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Import danh mục VPP từ Excel' })
  importExcel(@UploadedFile() file: Express.Multer.File, @Req() req) {
    return this.catalogService.importExcel(file, req.user.userId || req.user.user);
  }
}
