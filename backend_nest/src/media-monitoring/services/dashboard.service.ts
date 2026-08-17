import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleEntity } from '../entities/article.entity';
import { AlertEventEntity } from '../entities/alert-event.entity';
import { DashboardQueryDto } from '../dto/media.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ArticleEntity, 'mssqlConnection')
    private readonly articleRepo: Repository<ArticleEntity>,
    @InjectRepository(AlertEventEntity, 'mssqlConnection')
    private readonly alertEventRepo: Repository<AlertEventEntity>,
  ) {}

  private getDateRange(query: DashboardQueryDto): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    if (query.dateFrom && query.dateTo) {
      return { start: new Date(query.dateFrom), end: new Date(query.dateTo) };
    }
    switch (query.period) {
      case '30d': start.setDate(end.getDate() - 30); break;
      case 'quarter': start.setMonth(end.getMonth() - 3); break;
      case 'year': start.setFullYear(end.getFullYear() - 1); break;
      default: start.setDate(end.getDate() - 7);
    }
    return { start, end };
  }

  async getKpi(query: DashboardQueryDto) {
    const { start, end } = this.getDateRange(query);

    const [current, previous] = await Promise.all([
      this.articleRepo.query(`
        SELECT
          COUNT(*) as totalMentions,
          SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as totalNegative,
          SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as totalPositive,
          COUNT(DISTINCT source_id) as activeSources
        FROM mm_articles
        WHERE collected_at BETWEEN @0 AND @1
      `, [start, end]),
      this.articleRepo.query(`
        SELECT COUNT(*) as totalMentions
        FROM mm_articles
        WHERE collected_at BETWEEN @0 AND @1
      `, [new Date(start.getTime() - (end.getTime() - start.getTime())), start]),
    ]);

    const alertsToday = await this.alertEventRepo.query(`
      SELECT COUNT(*) as count FROM mm_alert_events
      WHERE CAST(triggered_at AS DATE) = CAST(GETDATE() AS DATE)
    `);

    const prevTotal = parseInt(previous[0]?.totalMentions || '0');
    const currTotal = parseInt(current[0]?.totalMentions || '0');
    const growth = prevTotal > 0 ? ((currTotal - prevTotal) / prevTotal) * 100 : 0;

    return {
      totalMentions: currTotal,
      totalNegative: parseInt(current[0]?.totalNegative || '0'),
      totalPositive: parseInt(current[0]?.totalPositive || '0'),
      alertsToday: parseInt(alertsToday[0]?.count || '0'),
      activeSources: parseInt(current[0]?.activeSources || '0'),
      growthPercentage: parseFloat(growth.toFixed(2)),
    };
  }

  async getTrend(query: DashboardQueryDto) {
    const { start, end } = this.getDateRange(query);
    return this.articleRepo.query(`
      SELECT
        CAST(collected_at AS DATE) as date,
        COUNT(*) as total,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative
      FROM mm_articles
      WHERE collected_at BETWEEN @0 AND @1
      GROUP BY CAST(collected_at AS DATE)
      ORDER BY date ASC
    `, [start, end]);
  }

  async getSentimentDistribution(query: DashboardQueryDto) {
    const { start, end } = this.getDateRange(query);
    return this.articleRepo.query(`
      SELECT sentiment, COUNT(*) as count
      FROM mm_articles
      WHERE collected_at BETWEEN @0 AND @1
      GROUP BY sentiment
    `, [start, end]);
  }

  async getTopSources(query: DashboardQueryDto) {
    const { start, end } = this.getDateRange(query);
    return this.articleRepo.query(`
      SELECT TOP 10
        s.id, s.name, s.type, s.url,
        COUNT(a.id) as articleCount,
        SUM(CASE WHEN a.sentiment = 'negative' THEN 1 ELSE 0 END) as negativeCount
      FROM mm_articles a
      INNER JOIN mm_news_sources s ON s.id = a.source_id
      WHERE a.collected_at BETWEEN @0 AND @1
      GROUP BY s.id, s.name, s.type, s.url
      ORDER BY articleCount DESC
    `, [start, end]);
  }

  async getHeatmap(query: DashboardQueryDto) {
    const { start, end } = this.getDateRange(query);
    return this.articleRepo.query(`
      SELECT
        DATEPART(WEEKDAY, collected_at) as dayOfWeek,
        DATEPART(HOUR, collected_at) as hour,
        COUNT(*) as count
      FROM mm_articles
      WHERE collected_at BETWEEN @0 AND @1
      GROUP BY DATEPART(WEEKDAY, collected_at), DATEPART(HOUR, collected_at)
      ORDER BY dayOfWeek, hour
    `, [start, end]);
  }

  async getKeywordCloud(query: DashboardQueryDto) {
    const { start, end } = this.getDateRange(query);
    return this.articleRepo.query(`
      SELECT TOP 30
        k.id, k.name, k.group, COUNT(m.id) as frequency
      FROM mm_article_keyword_matches m
      INNER JOIN mm_keywords k ON k.id = m.keyword_id
      INNER JOIN mm_articles a ON a.id = m.article_id
      WHERE a.collected_at BETWEEN @0 AND @1 AND k.is_exclude = 0
      GROUP BY k.id, k.name, k.group
      ORDER BY frequency DESC
    `, [start, end]);
  }

  async getSourceTypeDistribution(query: DashboardQueryDto) {
    const { start, end } = this.getDateRange(query);
    return this.articleRepo.query(`
      SELECT s.type, COUNT(a.id) as count
      FROM mm_articles a
      INNER JOIN mm_news_sources s ON s.id = a.source_id
      WHERE a.collected_at BETWEEN @0 AND @1
      GROUP BY s.type
    `, [start, end]);
  }

  async getRecentAlerts() {
    return this.alertEventRepo.find({
      order: { triggeredAt: 'DESC' },
      take: 3,
    });
  }

  async getActivityFeed() {
    return this.articleRepo.query(`
      SELECT TOP 20
        a.id, a.title, a.source_id, a.status,
        a.collected_at, s.name as source_name
      FROM mm_articles a
      LEFT JOIN mm_news_sources s ON s.id = a.source_id
      ORDER BY a.collected_at DESC
    `);
  }
}
