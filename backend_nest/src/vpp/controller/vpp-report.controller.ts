import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/oauth/jwt.guard';
import { VppReportService } from '../service/vpp-report.service';
import { VppAdminGuard } from '../guards/vpp-admin.guard';

import { VppUserGuard } from '../guards/vpp-user.guard';

@ApiTags('Báo cáo VPP (Màn 8)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VppUserGuard)
@Controller('v1/vpp/reports')
export class VppReportController {
  constructor(private readonly reportService: VppReportService) { }

  @Get('summary')
  @ApiOperation({ summary: 'Báo cáo tổng hợp – KPI đầu trang' })
  getSummary(@Query() query: any) {
    return this.reportService.getSummary(query);
  }

  @Get('stock-movement')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Danh sách báo cáo Xuất – Nhập – Tồn kho' })
  getStockMovement(@Query() query: any) {
    return this.reportService.getStockMovement(query);
  }

  @Get('by-department')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Báo cáo sử dụng VPP theo phòng ban' })
  getByDepartment(@Query() query: any) {
    return this.reportService.getByDepartment(query);
  }

  @Get('actual-vs-quota')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'So sánh sử dụng thực tế vs. Định mức' })
  getActualVsQuota(@Query() query: any) {
    return this.reportService.getActualVsQuota(query);
  }

  @Get('cost-summary')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Báo cáo chi phí tổng hợp' })
  getCostSummary(@Query() query: any) {
    return this.reportService.getCostSummary(query);
  }

  @Get('export')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Xuất file báo cáo Excel/PDF' })
  exportReport(@Query() query: any, @Res() res: any) {
    return this.reportService.exportReport(query, res);
  }
}
