import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { NewsSourceEntity } from './entities/news-source.entity';
import { KeywordEntity } from './entities/keyword.entity';
import { ArticleEntity } from './entities/article.entity';
import { ArticleKeywordMatchEntity } from './entities/article-keyword-match.entity';
import { ArticleTagEntity } from './entities/article-tag.entity';
import { ArticleProcessingEntity } from './entities/article-processing.entity';
import { AlertRuleEntity } from './entities/alert-rule.entity';
import { AlertRuleRecipientEntity } from './entities/alert-rule-recipient.entity';
import { AlertEventEntity } from './entities/alert-event.entity';
import { NotificationChannelEntity } from './entities/notification-channel.entity';
import { ReportTemplateEntity } from './entities/report-template.entity';
import { ReportRecipientEntity } from './entities/report-recipient.entity';
import { ReportSendHistoryEntity } from './entities/report-send-history.entity';

// Services
import { NewsSourceService } from './services/news-source.service';
import { KeywordService } from './services/keyword.service';
import { ArticleService } from './services/article.service';
import { ArticleProcessingService } from './services/article-processing.service';
import { AlertRuleService } from './services/alert-rule.service';
import { DashboardService } from './services/dashboard.service';
import { ReportTemplateService } from './services/report-template.service';

// Controllers
import { NewsSourceController } from './controllers/news-source.controller';
import { KeywordController } from './controllers/keyword.controller';
import { ArticleController } from './controllers/article.controller';
import { AlertRuleController } from './controllers/alert-rule.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { ReportTemplateController } from './controllers/report-template.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        NewsSourceEntity,
        KeywordEntity,
        ArticleEntity,
        ArticleKeywordMatchEntity,
        ArticleTagEntity,
        ArticleProcessingEntity,
        AlertRuleEntity,
        AlertRuleRecipientEntity,
        AlertEventEntity,
        NotificationChannelEntity,
        ReportTemplateEntity,
        ReportRecipientEntity,
        ReportSendHistoryEntity,
      ],
      'mssqlConnection',
    ),
  ],
  providers: [
    NewsSourceService,
    KeywordService,
    ArticleService,
    ArticleProcessingService,
    AlertRuleService,
    DashboardService,
    ReportTemplateService,
  ],
  controllers: [
    NewsSourceController,
    KeywordController,
    ArticleController,
    AlertRuleController,
    DashboardController,
    ReportTemplateController,
  ],
  exports: [
    NewsSourceService,
    KeywordService,
    ArticleService,
    AlertRuleService,
    DashboardService,
    ReportTemplateService,
  ],
})
export class MediaMonitoringModule {}
