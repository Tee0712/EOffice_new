import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { DashboardQueryDto } from '../dto/media.dto';

@Controller('media/dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('kpi')
  getKpi(@Query() query: DashboardQueryDto) {
    return this.service.getKpi(query);
  }

  @Get('trend')
  getTrend(@Query() query: DashboardQueryDto) {
    return this.service.getTrend(query);
  }

  @Get('sentiment')
  getSentiment(@Query() query: DashboardQueryDto) {
    return this.service.getSentimentDistribution(query);
  }

  @Get('top-sources')
  getTopSources(@Query() query: DashboardQueryDto) {
    return this.service.getTopSources(query);
  }

  @Get('heatmap')
  getHeatmap(@Query() query: DashboardQueryDto) {
    return this.service.getHeatmap(query);
  }

  @Get('keyword-cloud')
  getKeywordCloud(@Query() query: DashboardQueryDto) {
    return this.service.getKeywordCloud(query);
  }

  @Get('source-types')
  getSourceTypes(@Query() query: DashboardQueryDto) {
    return this.service.getSourceTypeDistribution(query);
  }

  @Get('recent-alerts')
  getRecentAlerts() {
    return this.service.getRecentAlerts();
  }

  @Get('activity')
  getActivity() {
    return this.service.getActivityFeed();
  }
}
