import {
  IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsNumber,
  IsArray, Min, Max, IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { NewsSourceType } from '../entities/news-source.entity';
import { KeywordGroup } from '../entities/keyword.entity';
import { ArticleSentiment, ArticleStatus, ArticleSeverity } from '../entities/article.entity';
import { ProcessingPriority } from '../entities/article-processing.entity';
import { AlertConditionType, AlertSeverity } from '../entities/alert-rule.entity';
import { ReportFrequency, ReportOutputFormat, ReportLanguage } from '../entities/report-template.entity';

// ==================== NEWS SOURCE ====================

export class CreateNewsSourceDto {
  @IsString() name: string;
  @IsString() url: string;
  @IsEnum(NewsSourceType) type: NewsSourceType;
  @IsInt() @Min(15) @IsOptional() scanFrequencyMinutes?: number;
  @IsInt() @IsOptional() priority?: number;
}

export class UpdateNewsSourceDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() url?: string;
  @IsEnum(NewsSourceType) @IsOptional() type?: NewsSourceType;
  @IsInt() @Min(15) @IsOptional() scanFrequencyMinutes?: number;
  @IsInt() @IsOptional() priority?: number;
}

export class QueryNewsSourceDto {
  @IsEnum(NewsSourceType) @IsOptional() type?: NewsSourceType;
  @IsString() @IsOptional() search?: string;
  @Transform(({ value }) => parseInt(value)) @IsInt() @IsOptional() page?: number;
  @Transform(({ value }) => parseInt(value)) @IsInt() @IsOptional() limit?: number;
}

// ==================== KEYWORD ====================

export class CreateKeywordDto {
  @IsString() name: string;
  @IsEnum(KeywordGroup) @IsOptional() group?: KeywordGroup;
  @IsBoolean() @IsOptional() isExclude?: boolean;
  @IsString() @IsOptional() iconType?: string;
  @IsInt() @IsOptional() priority?: number;
}

export class UpdateKeywordDto {
  @IsString() @IsOptional() name?: string;
  @IsEnum(KeywordGroup) @IsOptional() group?: KeywordGroup;
  @IsBoolean() @IsOptional() isActive?: boolean;
  @IsBoolean() @IsOptional() isExclude?: boolean;
  @IsInt() @IsOptional() priority?: number;
}

export class QueryKeywordDto {
  @IsEnum(KeywordGroup) @IsOptional() group?: KeywordGroup;
  @IsBoolean() @IsOptional() @Transform(({ value }) => value === 'true') isActive?: boolean;
  @IsString() @IsOptional() search?: string;
  @Transform(({ value }) => parseInt(value)) @IsInt() @IsOptional() page?: number;
  @Transform(({ value }) => parseInt(value)) @IsInt() @IsOptional() limit?: number;
}

export class ReorderKeywordDto {
  @IsArray() ids: string[];
}

// ==================== ARTICLE ====================

export class QueryArticleDto {
  @IsString() @IsOptional() sourceId?: string;
  @IsEnum(ArticleSentiment) @IsOptional() sentiment?: ArticleSentiment;
  @IsEnum(ArticleStatus) @IsOptional() status?: ArticleStatus;
  @IsEnum(ArticleSeverity) @IsOptional() severity?: ArticleSeverity;
  @IsString() @IsOptional() keywordId?: string;
  @IsString() @IsOptional() search?: string;
  @IsString() @IsOptional() dateFrom?: string;
  @IsString() @IsOptional() dateTo?: string;
  @IsString() @IsOptional() sortBy?: string;
  @IsString() @IsOptional() sortOrder?: 'ASC' | 'DESC';
  @Transform(({ value }) => parseInt(value)) @IsInt() @IsOptional() page?: number;
  @Transform(({ value }) => parseInt(value)) @IsInt() @IsOptional() limit?: number;
}

export class UpdateArticleStatusDto {
  @IsEnum(ArticleStatus) status: ArticleStatus;
}

export class BatchUpdateArticleDto {
  @IsArray() @IsUUID(undefined, { each: true }) ids: string[];
  @IsEnum(ArticleStatus) status: ArticleStatus;
}

// ==================== ARTICLE PROCESSING ====================

export class CreateArticleProcessingDto {
  @IsString() @IsOptional() internalNote?: string;
  @IsString() @IsOptional() responseSuggestion?: string;
  @IsEnum(ProcessingPriority) @IsOptional() priorityLevel?: ProcessingPriority;
  @IsBoolean() @IsOptional() escalated?: boolean;
}

export class ForwardArticleDto {
  @IsArray() @IsString({ each: true }) departmentIds: string[];
}

// ==================== ALERT RULE ====================

export class CreateAlertRuleDto {
  @IsString() name: string;
  @IsEnum(AlertConditionType) conditionType: AlertConditionType;
  @IsNumber() @IsOptional() thresholdValue?: number;
  @IsEnum(AlertSeverity) @IsOptional() severity?: AlertSeverity;
  @IsArray() @IsString({ each: true }) @IsOptional() channels?: string[];
  @IsInt() @IsOptional() @Min(0) @Max(23) quietHoursStart?: number;
  @IsInt() @IsOptional() @Min(0) @Max(23) quietHoursEnd?: number;
  @IsBoolean() @IsOptional() applyWeekend?: boolean;
  @IsBoolean() @IsOptional() alwaysSendCritical?: boolean;
  @IsArray() @IsString({ each: true }) @IsOptional() recipientIds?: string[];
}

export class UpdateAlertRuleDto {
  @IsString() @IsOptional() name?: string;
  @IsEnum(AlertConditionType) @IsOptional() conditionType?: AlertConditionType;
  @IsNumber() @IsOptional() thresholdValue?: number;
  @IsEnum(AlertSeverity) @IsOptional() severity?: AlertSeverity;
  @IsArray() @IsString({ each: true }) @IsOptional() channels?: string[];
  @IsInt() @IsOptional() @Min(0) @Max(23) quietHoursStart?: number;
  @IsInt() @IsOptional() @Min(0) @Max(23) quietHoursEnd?: number;
  @IsBoolean() @IsOptional() applyWeekend?: boolean;
  @IsBoolean() @IsOptional() alwaysSendCritical?: boolean;
}

export class QueryAlertRuleDto {
  @IsBoolean() @IsOptional() @Transform(({ value }) => value === 'true') isActive?: boolean;
  @Transform(({ value }) => parseInt(value)) @IsInt() @IsOptional() page?: number;
  @Transform(({ value }) => parseInt(value)) @IsInt() @IsOptional() limit?: number;
}

// ==================== REPORT TEMPLATE ====================

export class CreateReportTemplateDto {
  @IsString() name: string;
  @IsEnum(ReportFrequency) @IsOptional() frequency?: ReportFrequency;
  @IsString() @IsOptional() sendTime?: string;
  @IsEnum(ReportLanguage) @IsOptional() language?: ReportLanguage;
  @IsString() @IsOptional() dataRange?: string;
  @IsEnum(ReportOutputFormat) @IsOptional() outputFormat?: ReportOutputFormat;
  @IsOptional() sectionsEnabled?: Record<string, boolean>;
  @IsArray() @IsString({ each: true }) @IsOptional() recipientIds?: string[];
}

export class UpdateReportTemplateDto {
  @IsString() @IsOptional() name?: string;
  @IsEnum(ReportFrequency) @IsOptional() frequency?: ReportFrequency;
  @IsString() @IsOptional() sendTime?: string;
  @IsEnum(ReportLanguage) @IsOptional() language?: ReportLanguage;
  @IsString() @IsOptional() dataRange?: string;
  @IsEnum(ReportOutputFormat) @IsOptional() outputFormat?: ReportOutputFormat;
  @IsOptional() sectionsEnabled?: Record<string, boolean>;
  @IsArray() @IsString({ each: true }) @IsOptional() recipientIds?: string[];
}

export class QueryReportTemplateDto {
  @Transform(({ value }) => parseInt(value)) @IsInt() @IsOptional() page?: number;
  @Transform(({ value }) => parseInt(value)) @IsInt() @IsOptional() limit?: number;
}

// ==================== DASHBOARD ====================

export class DashboardQueryDto {
  @IsString() @IsOptional() period?: '7d' | '30d' | 'quarter' | 'year';
  @IsString() @IsOptional() dateFrom?: string;
  @IsString() @IsOptional() dateTo?: string;
}
