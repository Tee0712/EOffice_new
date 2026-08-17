import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from '../service/dashboard.service';
import { DashboardQueryDto } from '../dto/dashboard-query.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('ASXH Dashboard')
@Controller('/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Lấy dữ liệu tổng hợp KPI cho Dashboard' })
  @ApiResponse({ status: 200, description: 'Trả về 4 chỉ số KPI chính' })
  async getSummary(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getSummary(query);
  }

  @Get('disbursement-trend')
  @ApiOperation({ summary: 'Lấy xu hướng giải ngân theo tháng' })
  async getDisbursementTrend(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getDisbursementTrend(query);
  }

  @Get('funding-distribution')
  @ApiOperation({ summary: 'Lấy phân bổ theo loại hình tài trợ' })
  async getFundingDistribution(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getFundingDistribution(query);
  }

  @Get('programs')
  @ApiOperation({ summary: 'Lấy danh sách chương trình cho Dashboard' })
  async getPrograms(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getPrograms(query);
  }

  @Get('upcoming-events')
  @ApiOperation({ summary: 'Lấy danh sách sự kiện sắp tới' })
  async getUpcomingEvents(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getUpcomingEvents(query);
  }

  @Get('locality-distribution')
  @ApiOperation({ summary: 'Lấy phân bổ ngân sách theo khu vực (Top 5)' })
  async getLocalityDistribution(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getLocalityDistribution(query);
  }
}
