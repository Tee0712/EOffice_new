import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as moment from 'moment';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, Between, In, DataSource } from 'typeorm';
import { DishEntity } from './entities/dish.entity';
import { SupplierEntity } from './entities/supplier.entity';
import { MenuEntity } from './entities/menu.entity';
import { MenuItemEntity } from './entities/menu-item.entity';
import { MenuTemplateEntity } from './entities/menu-template.entity';
import { MenuTemplateItemEntity } from './entities/menu-template-item.entity';
import { MealTemplateEntity } from './entities/meal-template.entity';
import { MealRegistrationEntity } from './entities/meal-registration.entity';
import { LeaveBusinessRecordEntity } from './entities/leave-business-record.entity';
import { SystemSettingEntity } from './entities/system-setting.entity';
import { MealCheckinEntity } from './entities/meal-checkin.entity';
import { MealActualServingEntity } from './entities/meal-actual-serving.entity';
import { SupplierContractEntity } from './entities/supplier-contract.entity';
import { SupplierOrderEntity } from './entities/supplier-order.entity';
import { SupplierEvaluationEntity } from './entities/supplier-evaluation.entity';
import { SupplierEvaluationScoreEntity } from './entities/supplier-evaluation-score.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import {
  CreateWeeklyMenuDto, CreateTemplateDto, ApplyTemplateDto,
  DailyMenuDto, UpdateMenuStatusDto, CopyDailyMenuDto,
  CheckInDto, ActualServingDto, SupplierContractDto,
  SupplierOrderDto, SupplierEvaluationDto,
  RegisterMealDto, BulkRegisterDto, CancelRegistrationDto,
  WeeklyMenuSaveDto, DailyMenuSetupSaveDto, SupplierOverviewDto,
  SupplierDetailDto, SupplierDetailTabCountsDto, SupplierContractListItemDto,
  SupplierEvaluationStatsDto, DashboardFilterDto, DashboardSummaryDto
} from './dto';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';



const LOG_FILE = path.join(process.cwd(), 'meal_debug.log');
const log = (msg: string) => {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${msg}\n`);
  } catch (e) {
    // console.error('Failed to log:', e);
  }
};

@Injectable()
export class MealService implements OnModuleInit {
  private readonly mealSessionMap: Record<number, string> = {
    1: 'breakfast',
    2: 'lunch',
    3: 'dinner',
  };

  private readonly slotSessionMap: Record<string, number> = {
    breakfast: 1,
    lunch: 2,
    dinner: 3,
  };

  constructor(
    @InjectRepository(DishEntity, 'mssqlConnection')
    private dishRepo: Repository<DishEntity>,
    @InjectRepository(SupplierEntity, 'mssqlConnection')
    private supplierRepo: Repository<SupplierEntity>,
    @InjectRepository(MenuEntity, 'mssqlConnection')
    private menuRepo: Repository<MenuEntity>,
    @InjectRepository(MenuItemEntity, 'mssqlConnection')
    private menuItemRepo: Repository<MenuItemEntity>,
    @InjectRepository(MenuTemplateEntity, 'mssqlConnection')
    private templateRepo: Repository<MenuTemplateEntity>,
    @InjectRepository(MenuTemplateItemEntity, 'mssqlConnection')
    private templateItemRepo: Repository<MenuTemplateItemEntity>,
    @InjectRepository(MealTemplateEntity, 'mssqlConnection')
    private mealTemplateRepo: Repository<MealTemplateEntity>,
    @InjectRepository(MealRegistrationEntity, 'mssqlConnection')
    private registrationRepo: Repository<MealRegistrationEntity>,
    @InjectRepository(LeaveBusinessRecordEntity, 'mssqlConnection')
    private leaveRepo: Repository<LeaveBusinessRecordEntity>,
    @InjectRepository(SystemSettingEntity, 'mssqlConnection')
    private systemSettingRepo: Repository<SystemSettingEntity>,
    @InjectRepository(MealCheckinEntity, 'mssqlConnection')
    private checkinRepo: Repository<MealCheckinEntity>,
    @InjectRepository(MealActualServingEntity, 'mssqlConnection')
    private actualServingRepo: Repository<MealActualServingEntity>,
    @InjectRepository(SupplierContractEntity, 'mssqlConnection')
    private contractRepo: Repository<SupplierContractEntity>,
    @InjectRepository(SupplierOrderEntity, 'mssqlConnection')
    private orderRepo: Repository<SupplierOrderEntity>,
    @InjectRepository(SupplierEvaluationEntity, 'mssqlConnection')
    private evaluationRepo: Repository<SupplierEvaluationEntity>,
    @InjectRepository(SupplierEvaluationScoreEntity, 'mssqlConnection')
    private evaluationScoreRepo: Repository<SupplierEvaluationScoreEntity>,
    @InjectRepository(AuditLogEntity, 'mssqlConnection')
    private auditLogRepo: Repository<AuditLogEntity>,
    @InjectDataSource('mssqlConnection')
    private dataSource: DataSource,
  ) { }

  private validateMenuNotLocked(date: string | Date) {
    const endOfCurrentWeek = moment().endOf('isoWeek').startOf('day');
    const targetDate = moment(date).startOf('day');
    if (targetDate.isSameOrBefore(endOfCurrentWeek)) {
      throw new BadRequestException('KhÃ´ng Ä‘Æ°á»£c phÃ©p thay Ä‘á»•i thá»±c Ä‘Æ¡n cá»§a tuáº§n hiá»‡n táº¡i hoáº·c quÃ¡ khá»©.');
    }
  }

  async onModuleInit() {
    log('[MealService] onModuleInit started');
    const safeQuery = async (query: string, description: string) => {
      try {
        await this.dataSource.query(query);
        log(`[Sync] Success: ${description}`);
      } catch (e) {
        log(`[Sync] Info: ${description} (might already exist or failed): ${e.message}`);
      }
    };

    try {
      log('[MealService] Starting robust database sync...');

      // 1. Ensure tables exist (CREATE IF NOT EXISTS)
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'system_settings') CREATE TABLE system_settings (id INT IDENTITY(1,1) PRIMARY KEY, [group] NVARCHAR(50), [key] NVARCHAR(100), [value] NVARCHAR(MAX), value_type NVARCHAR(50), label NVARCHAR(150), description NVARCHAR(255), is_public TINYINT DEFAULT 0, created_at DATETIME DEFAULT GETDATE(), updated_at DATETIME DEFAULT GETDATE());`, 'Create system_settings');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'suppliers') CREATE TABLE suppliers (id BIGINT IDENTITY(1,1) PRIMARY KEY, supplier_code NVARCHAR(20) UNIQUE NOT NULL, name NVARCHAR(255) NOT NULL);`, 'Create suppliers');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'dishes') CREATE TABLE dishes (id BIGINT IDENTITY(1,1) PRIMARY KEY, name NVARCHAR(255) NOT NULL);`, 'Create dishes');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'menus') CREATE TABLE menus (id BIGINT IDENTITY(1,1) PRIMARY KEY, menu_date DATE NOT NULL, meal_slot NVARCHAR(50) NOT NULL);`, 'Create menus');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'menu_items') CREATE TABLE menu_items (id BIGINT IDENTITY(1,1) PRIMARY KEY, menu_id BIGINT NOT NULL, dish_id BIGINT NOT NULL);`, 'Create menu_items');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'menu_templates') CREATE TABLE menu_templates (id BIGINT IDENTITY(1,1) PRIMARY KEY, name NVARCHAR(255) NOT NULL);`, 'Create menu_templates');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'menu_template_items') CREATE TABLE menu_template_items (id BIGINT IDENTITY(1,1) PRIMARY KEY, template_id BIGINT NOT NULL, day_offset INT NOT NULL, meal_slot NVARCHAR(50) NOT NULL, dish_id BIGINT NOT NULL);`, 'Create menu_template_items');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'meal_registrations') CREATE TABLE meal_registrations (id BIGINT IDENTITY(1,1) PRIMARY KEY, user_id NVARCHAR(100) NOT NULL, menu_id BIGINT NOT NULL);`, 'Create meal_registrations');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'meal_reviews') CREATE TABLE meal_reviews (id BIGINT IDENTITY(1,1) PRIMARY KEY, menu_id BIGINT NOT NULL, user_id NVARCHAR(100) NOT NULL, review_date DATE NULL, meal_type_id INT NULL, supplier_id BIGINT NULL, taste_score INT DEFAULT 0, hygiene_score INT DEFAULT 0, portion_score INT DEFAULT 0, variety_score INT DEFAULT 0, service_score INT DEFAULT 0, overall_score DECIMAL(4,2) DEFAULT 0, comment_text NVARCHAR(MAX) NULL, review_status NVARCHAR(50) DEFAULT 'pending_reply', has_reply TINYINT DEFAULT 0, has_images TINYINT DEFAULT 0, submitted_at DATETIME DEFAULT GETDATE(), updated_at DATETIME DEFAULT GETDATE());`, 'Create meal_reviews');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'meal_review_replies') CREATE TABLE meal_review_replies (id BIGINT IDENTITY(1,1) PRIMARY KEY, review_id BIGINT NOT NULL, reply_content NVARCHAR(MAX) NOT NULL, reply_type NVARCHAR(50) DEFAULT 'kitchen_reply', is_official TINYINT DEFAULT 1, replied_by NVARCHAR(100) NULL, replied_at DATETIME DEFAULT GETDATE());`, 'Create meal_review_replies');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'meal_review_images') CREATE TABLE meal_review_images (id BIGINT IDENTITY(1,1) PRIMARY KEY, review_id BIGINT NOT NULL, file_name NVARCHAR(255) NOT NULL, file_url NVARCHAR(700) NOT NULL, file_path NVARCHAR(700) NULL, uploaded_by NVARCHAR(100) NULL, uploaded_at DATETIME DEFAULT GETDATE());`, 'Create meal_review_images');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'meal_actual_servings') CREATE TABLE meal_actual_servings (id BIGINT IDENTITY(1,1) PRIMARY KEY, menu_id BIGINT NOT NULL, menu_item_id BIGINT NULL, actual_qty INT DEFAULT 0);`, 'Create meal_actual_servings');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'supplier_contracts') CREATE TABLE supplier_contracts (id BIGINT IDENTITY(1,1) PRIMARY KEY, supplier_id BIGINT NOT NULL, contract_no NVARCHAR(50) NOT NULL, contract_type NVARCHAR(50) NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, value_amount DECIMAL(15,2) DEFAULT 0, status NVARCHAR(50) DEFAULT 'draft', file_url NVARCHAR(500) NULL, notes NVARCHAR(MAX) NULL);`, 'Create supplier_contracts');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'supplier_orders') CREATE TABLE supplier_orders (id BIGINT IDENTITY(1,1) PRIMARY KEY, supplier_id BIGINT NOT NULL, order_no NVARCHAR(30) NOT NULL, menu_id BIGINT NULL, order_date DATE NOT NULL, meal_slot NVARCHAR(50) NOT NULL, expected_qty INT DEFAULT 0, delivered_qty INT NULL, unit_price DECIMAL(10,2) DEFAULT 0, status NVARCHAR(50) DEFAULT 'draft', note NVARCHAR(MAX) NULL);`, 'Create supplier_orders');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'supplier_evaluations') CREATE TABLE supplier_evaluations (id BIGINT IDENTITY(1,1) PRIMARY KEY, supplier_id BIGINT NOT NULL, supplier_order_id BIGINT NULL, dish_id BIGINT NULL, period_type NVARCHAR(50) DEFAULT 'delivery', period_start_date DATE NULL, period_end_date DATE NULL, evaluation_status NVARCHAR(50) DEFAULT 'draft', overall_score DECIMAL(3,2) NULL, overall_rating NVARCHAR(20) NULL, comment NVARCHAR(MAX) NULL);`, 'Create supplier_evaluations');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'supplier_evaluation_scores') CREATE TABLE supplier_evaluation_scores (id BIGINT IDENTITY(1,1) PRIMARY KEY, evaluation_id BIGINT NOT NULL, criterion_code NVARCHAR(30) NOT NULL, score TINYINT NOT NULL, comment NVARCHAR(MAX) NULL);`, 'Create supplier_evaluation_scores');
      await safeQuery(`IF OBJECT_ID('supplier_contracts', 'U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('supplier_contracts') AND name = 'id') ALTER TABLE supplier_contracts ADD id BIGINT IDENTITY(1,1) NOT NULL;`, 'Add supplier_contracts.id');
      await safeQuery(`IF OBJECT_ID('supplier_orders', 'U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('supplier_orders') AND name = 'id') ALTER TABLE supplier_orders ADD id BIGINT IDENTITY(1,1) NOT NULL;`, 'Add supplier_orders.id');
      await safeQuery(`IF OBJECT_ID('supplier_evaluations', 'U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('supplier_evaluations') AND name = 'id') ALTER TABLE supplier_evaluations ADD id BIGINT IDENTITY(1,1) NOT NULL;`, 'Add supplier_evaluations.id');
      await safeQuery(`IF OBJECT_ID('supplier_evaluation_scores', 'U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('supplier_evaluation_scores') AND name = 'id') ALTER TABLE supplier_evaluation_scores ADD id BIGINT IDENTITY(1,1) NOT NULL;`, 'Add supplier_evaluation_scores.id');

      // SRS doc159 tables
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'meal_sessions') CREATE TABLE meal_sessions (id INT IDENTITY(1,1) PRIMARY KEY, name NVARCHAR(50) NOT NULL, time_start VARCHAR(10) NOT NULL, time_end VARCHAR(10) NOT NULL, icon NVARCHAR(255) NULL, sort_order INT NOT NULL DEFAULT 0);`, 'Create meal_sessions');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM meal_sessions) INSERT INTO meal_sessions (name, time_start, time_end, icon, sort_order) VALUES (N'Ăn sáng', '06:30', '08:00', NULL, 1), (N'Ăn trưa', '11:00', '13:00', NULL, 2), (N'Ăn tối', '17:30', '19:00', NULL, 3);`, 'Seed meal_sessions');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'daily_menus') CREATE TABLE daily_menus (id BIGINT IDENTITY(1,1) PRIMARY KEY, date DATE NOT NULL, meal_session_id INT NOT NULL REFERENCES meal_sessions(id), is_active BIT NOT NULL DEFAULT 1, dish_name NVARCHAR(500) NOT NULL, description NVARCHAR(MAX) NULL, price DECIMAL(12,0) NOT NULL, serving_time VARCHAR(20) NULL, photo_url NVARCHAR(500) NULL, created_by NVARCHAR(100) NULL, updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), CONSTRAINT UQ_daily_menus_date_session UNIQUE (date, meal_session_id));`, 'Create daily_menus');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'canteen_registrations') CREATE TABLE canteen_registrations (id BIGINT IDENTITY(1,1) PRIMARY KEY, user_id NVARCHAR(100) NOT NULL, date DATE NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'upcoming', total_cost DECIMAL(12,0) NOT NULL DEFAULT 0, note NVARCHAR(500) NULL, registered_at DATETIME2 NULL, cancelled_at DATETIME2 NULL, cancel_reason NVARCHAR(MAX) NULL, is_refunded BIT NOT NULL DEFAULT 0, refund_amount DECIMAL(12,0) NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), CONSTRAINT UQ_canteen_reg_user_date UNIQUE (user_id, date));`, 'Create canteen_registrations');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'registration_items') CREATE TABLE registration_items (id BIGINT IDENTITY(1,1) PRIMARY KEY, registration_id BIGINT NOT NULL REFERENCES canteen_registrations(id) ON DELETE CASCADE, meal_session_id INT NOT NULL REFERENCES meal_sessions(id), daily_menu_id BIGINT NOT NULL REFERENCES daily_menus(id), price_at_time DECIMAL(12,0) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), CONSTRAINT UQ_reg_item_reg_session UNIQUE (registration_id, meal_session_id));`, 'Create registration_items');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'registration_history') CREATE TABLE registration_history (id BIGINT IDENTITY(1,1) PRIMARY KEY, registration_id BIGINT NOT NULL REFERENCES canteen_registrations(id) ON DELETE CASCADE, action VARCHAR(20) NOT NULL, description NVARCHAR(MAX) NULL, changed_by NVARCHAR(100) NOT NULL, changed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());`, 'Create registration_history');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'meal_templates') CREATE TABLE meal_templates (id INT IDENTITY(1,1) PRIMARY KEY, user_id NVARCHAR(100) NULL, name NVARCHAR(200) NOT NULL, meal_sessions NVARCHAR(MAX) NOT NULL, is_system BIT NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());`, 'Create meal_templates');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'canteen_system_settings') CREATE TABLE canteen_system_settings (id INT IDENTITY(1,1) PRIMARY KEY, registration_deadline_time VARCHAR(10) NOT NULL DEFAULT '16:00', cancellation_deadline_time VARCHAR(10) NOT NULL DEFAULT '10:00', allow_multi_meal BIT NOT NULL DEFAULT 1, allow_bulk_registration BIT NOT NULL DEFAULT 1, auto_cancel_on_business_trip BIT NOT NULL DEFAULT 1, auto_cancel_on_leave BIT NOT NULL DEFAULT 1, require_cancel_reason BIT NOT NULL DEFAULT 0, weekend_service BIT NOT NULL DEFAULT 0, refund_rate_on_time DECIMAL(5,2) NOT NULL DEFAULT 100.00, refund_rate_late DECIMAL(5,2) NOT NULL DEFAULT 0.00, updated_by NVARCHAR(100) NULL, updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());`, 'Create canteen_system_settings');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'canteen_user_settings') CREATE TABLE canteen_user_settings (id INT IDENTITY(1,1) PRIMARY KEY, user_id NVARCHAR(100) NOT NULL, auto_cancel_on_trip BIT NOT NULL DEFAULT 1, auto_cancel_on_leave BIT NOT NULL DEFAULT 1, receive_email_notification BIT NOT NULL DEFAULT 1, remind_before_1_day BIT NOT NULL DEFAULT 0, updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), CONSTRAINT UQ_canteen_user_settings_user UNIQUE (user_id));`, 'Create canteen_user_settings');
      await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'meal_evaluations') CREATE TABLE meal_evaluations (id BIGINT IDENTITY(1,1) PRIMARY KEY, user_id NVARCHAR(100) NOT NULL, menu_id BIGINT NOT NULL, supplier_id BIGINT NULL, supplier_order_id BIGINT NULL, taste_score TINYINT NOT NULL, hygiene_score TINYINT NOT NULL, portion_score TINYINT NOT NULL, diversity_score TINYINT NOT NULL, service_score TINYINT NOT NULL, overall_score DECIMAL(3, 2) NOT NULL, comment NVARCHAR(MAX) NULL, images_json NVARCHAR(MAX) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());`, 'Create meal_evaluations');

      await safeQuery(
        `IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_meal_reviews_user_menu' AND object_id = OBJECT_ID('meal_reviews') AND is_unique = 1)
           DROP INDEX IX_meal_reviews_user_menu ON meal_reviews;`,
        'Drop unique index IX_meal_reviews_user_menu',
      );
      await safeQuery(
        `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_meal_reviews_user_menu' AND object_id = OBJECT_ID('meal_reviews'))
           CREATE INDEX IX_meal_reviews_user_menu ON meal_reviews(user_id, menu_id);`,
        'Create index IX_meal_reviews_user_menu',
      );

      // 2. Add missing columns for 'suppliers'
      const columnsSuppliers = [
        ['type', "NVARCHAR(50) DEFAULT 'cong_nghiep'"],
        ['tax_code', 'NVARCHAR(20)'],
        ['representative_name', 'NVARCHAR(100)'],
        ['phone', 'NVARCHAR(20)'],
        ['email', 'NVARCHAR(150)'],
        ['address', 'NVARCHAR(MAX)'],
        ['logo_url', 'NVARCHAR(500)'],
        ['is_active', 'TINYINT DEFAULT 1'],
        ['contract_status_cached', "NVARCHAR(50) DEFAULT 'pending'"],
        ['contract_end_at_cached', 'DATE'],
        ['rating_avg_cached', 'DECIMAL(3,2) DEFAULT 0'],
        ['rating_count_cached', 'INT DEFAULT 0'],
        ['created_at', 'DATETIME DEFAULT GETDATE()'],
        ['created_by', 'NVARCHAR(100)'],
        ['updated_at', 'DATETIME DEFAULT GETDATE()'],
        ['updated_by', 'NVARCHAR(100)'],
        ['deleted_at', 'DATETIME'],
        ['deleted_by', 'NVARCHAR(100)']
      ];
      for (const [name, def] of columnsSuppliers) {
        await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('suppliers') AND name = '${name}') ALTER TABLE suppliers ADD [${name}] ${def};`, `Add suppliers.${name}`);
      }

      // 3. Add missing columns for 'dishes'
      const columnsDishes = [
        ['dish_code', 'NVARCHAR(50)'],
        ['description', 'NVARCHAR(MAX)'],
        ['image_url', 'NVARCHAR(500)'],
        ['category', "NVARCHAR(50) DEFAULT 'com'"],
        ['ingredient_note', 'NVARCHAR(MAX)'],
        ['tags_json', 'NVARCHAR(MAX)'],
        ['is_active', 'TINYINT DEFAULT 1'],
        ['is_popular_cached', 'TINYINT DEFAULT 0'],
        ['popular_count_cached', 'INT DEFAULT 0'],
        ['created_at', 'DATETIME DEFAULT GETDATE()'],
        ['created_by', 'NVARCHAR(100)'],
        ['updated_at', 'DATETIME DEFAULT GETDATE()'],
        ['updated_by', 'NVARCHAR(100)'],
        ['deleted_at', 'DATETIME'],
        ['deleted_by', 'NVARCHAR(100)']
      ];
      for (const [name, def] of columnsDishes) {
        await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dishes') AND name = '${name}') ALTER TABLE dishes ADD [${name}] ${def};`, `Add dishes.${name}`);
      }

      // 4. Add missing columns for 'menus'
      const columnsMenus = [
        ['supplier_id', 'BIGINT'],
        ['status', "NVARCHAR(50) DEFAULT 'draft'"],
        ['price_total_planned', 'DECIMAL(12,2) DEFAULT 0'],
        ['published_at', 'DATETIME'],
        ['publish_deadline_at', 'DATETIME'],
        ['register_deadline_at', 'DATETIME'],
        ['cancel_deadline_at', 'DATETIME'],
        ['note', 'NVARCHAR(MAX)'],
        ['is_active', 'TINYINT DEFAULT 1'],
        ['serving_time', 'NVARCHAR(100)'],
        ['image_url_manual', 'NVARCHAR(500)'],
        ['description_manual', 'NVARCHAR(MAX)'],
        ['title_manual', 'NVARCHAR(500)'],
        ['created_at', 'DATETIME DEFAULT GETDATE()'],
        ['created_by', 'NVARCHAR(100)'],
        ['updated_at', 'DATETIME DEFAULT GETDATE()'],
        ['updated_by', 'NVARCHAR(100)'],
        ['deleted_at', 'DATETIME'],
        ['deleted_by', 'NVARCHAR(100)']
      ];
      for (const [name, def] of columnsMenus) {
        await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('menus') AND name = '${name}') ALTER TABLE menus ADD [${name}] ${def};`, `Add menus.${name}`);
      }

      // 5. Add missing columns for 'menu_items'
      const columnsMenuItems = [
        ['supplier_id', 'BIGINT'],
        ['unit_price_snapshot', 'DECIMAL(10,2) DEFAULT 0'],
        ['unit', "NVARCHAR(20) DEFAULT N'suáº¥t'"],
        ['service_start_time', 'TIME'],
        ['service_end_time', 'TIME'],
        ['sort_order', 'INT DEFAULT 0'],
        ['note', 'NVARCHAR(255)'],
        ['created_at', 'DATETIME DEFAULT GETDATE()'],
        ['created_by', 'NVARCHAR(100)'],
        ['updated_at', 'DATETIME DEFAULT GETDATE()'],
        ['updated_by', 'NVARCHAR(100)'],
        ['deleted_at', 'DATETIME'],
        ['deleted_by', 'NVARCHAR(100)']
      ];
      for (const [name, def] of columnsMenuItems) {
        await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('menu_items') AND name = '${name}') ALTER TABLE menu_items ADD [${name}] ${def};`, `Add menu_items.${name}`);
      }
      await safeQuery(
        `
        IF EXISTS (
          SELECT 1
          FROM sys.columns
          WHERE object_id = OBJECT_ID('menu_items')
            AND name = 'id'
            AND is_identity = 0
        )
        BEGIN
          DECLARE @maxMenuItemId BIGINT = ISNULL((SELECT MAX(id) FROM menu_items), 0);
          DECLARE @nextMenuItemId BIGINT = @maxMenuItemId + 1;

          IF OBJECT_ID('dbo.seq_menu_items_id', 'SO') IS NULL
          BEGIN
            EXEC(N'CREATE SEQUENCE dbo.seq_menu_items_id AS BIGINT START WITH 1 INCREMENT BY 1');
          END

          IF EXISTS (
            SELECT 1
            FROM sys.sequences
            WHERE name = 'seq_menu_items_id'
              AND schema_id = SCHEMA_ID('dbo')
              AND CAST(current_value AS BIGINT) < @nextMenuItemId
          )
          BEGIN
            DECLARE @alterSeqSql NVARCHAR(200) = N'ALTER SEQUENCE dbo.seq_menu_items_id RESTART WITH ' + CONVERT(NVARCHAR(30), @nextMenuItemId);
            EXEC(@alterSeqSql);
          END

          IF NOT EXISTS (
            SELECT 1
            FROM sys.default_constraints dc
            JOIN sys.columns c
              ON c.default_object_id = dc.object_id
            WHERE dc.parent_object_id = OBJECT_ID('menu_items')
              AND c.name = 'id'
          )
          BEGIN
            ALTER TABLE menu_items
              ADD CONSTRAINT DF_menu_items_id
              DEFAULT (NEXT VALUE FOR dbo.seq_menu_items_id) FOR id;
          END
        END
        `,
        'Ensure menu_items.id auto-generated fallback',
      );

      // 6. Add missing columns for 'meal_actual_servings'
      const columnsActualServings = [
        ['supplier_order_id', 'BIGINT'],
        ['actual_amount', 'DECIMAL(12,2)'],
        ['source', "NVARCHAR(20) DEFAULT 'manual'"],
        ['recorded_at', 'DATETIME DEFAULT GETDATE()'],
        ['recorded_by', 'NVARCHAR(100)'],
        ['note', 'NVARCHAR(MAX)'],
        ['created_at', 'DATETIME DEFAULT GETDATE()'],
        ['created_by', 'NVARCHAR(100)'],
        ['updated_at', 'DATETIME DEFAULT GETDATE()'],
        ['updated_by', 'NVARCHAR(100)'],
        ['deleted_at', 'DATETIME'],
        ['deleted_by', 'NVARCHAR(100)']
      ];
      for (const [name, def] of columnsActualServings) {
        await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('meal_actual_servings') AND name = '${name}') ALTER TABLE meal_actual_servings ADD [${name}] ${def};`, `Add meal_actual_servings.${name}`);
      }

      // 7. Add missing columns for supplier_contracts / supplier_orders / supplier_evaluations / supplier_evaluation_scores
      const columnsSupplierContracts = [
        ['supplier_id', 'BIGINT'],
        ['contract_no', 'NVARCHAR(50)'],
        ['contract_type', 'NVARCHAR(50)'],
        ['start_date', 'DATE'],
        ['end_date', 'DATE'],
        ['value_amount', 'DECIMAL(15,2) DEFAULT 0'],
        ['status', "NVARCHAR(50) DEFAULT 'draft'"],
        ['file_url', 'NVARCHAR(500)'],
        ['notes', 'NVARCHAR(MAX)'],
        ['created_at', 'DATETIME DEFAULT GETDATE()'],
        ['created_by', 'NVARCHAR(100)'],
        ['updated_at', 'DATETIME DEFAULT GETDATE()'],
        ['updated_by', 'NVARCHAR(100)'],
        ['deleted_at', 'DATETIME'],
        ['deleted_by', 'NVARCHAR(100)']
      ];
      for (const [name, def] of columnsSupplierContracts) {
        await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('supplier_contracts') AND name = '${name}') ALTER TABLE supplier_contracts ADD [${name}] ${def};`, `Add supplier_contracts.${name}`);
      }

      const columnsSupplierOrders = [
        ['supplier_id', 'BIGINT'],
        ['order_no', 'NVARCHAR(30)'],
        ['menu_id', 'BIGINT'],
        ['order_date', 'DATE'],
        ['meal_slot', "NVARCHAR(50) DEFAULT 'lunch'"],
        ['expected_qty', 'INT DEFAULT 0'],
        ['delivered_qty', 'INT'],
        ['unit_price', 'DECIMAL(10,2) DEFAULT 0'],
        ['status', "NVARCHAR(50) DEFAULT 'draft'"],
        ['note', 'NVARCHAR(MAX)'],
        ['created_at', 'DATETIME DEFAULT GETDATE()'],
        ['created_by', 'NVARCHAR(100)'],
        ['updated_at', 'DATETIME DEFAULT GETDATE()'],
        ['updated_by', 'NVARCHAR(100)'],
        ['deleted_at', 'DATETIME'],
        ['deleted_by', 'NVARCHAR(100)']
      ];
      for (const [name, def] of columnsSupplierOrders) {
        await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('supplier_orders') AND name = '${name}') ALTER TABLE supplier_orders ADD [${name}] ${def};`, `Add supplier_orders.${name}`);
      }

      const columnsSupplierEvaluations = [
        ['supplier_id', 'BIGINT'],
        ['supplier_order_id', 'BIGINT'],
        ['dish_id', 'BIGINT'],
        ['period_type', "NVARCHAR(50) DEFAULT 'delivery'"],
        ['period_start_date', 'DATE'],
        ['period_end_date', 'DATE'],
        ['evaluation_status', "NVARCHAR(50) DEFAULT 'draft'"],
        ['overall_score', 'DECIMAL(3,2)'],
        ['overall_rating', 'NVARCHAR(20)'],
        ['comment', 'NVARCHAR(MAX)'],
        ['created_at', 'DATETIME DEFAULT GETDATE()'],
        ['created_by', 'NVARCHAR(100)'],
        ['updated_at', 'DATETIME DEFAULT GETDATE()'],
        ['updated_by', 'NVARCHAR(100)'],
        ['deleted_at', 'DATETIME'],
        ['deleted_by', 'NVARCHAR(100)']
      ];
      for (const [name, def] of columnsSupplierEvaluations) {
        await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('supplier_evaluations') AND name = '${name}') ALTER TABLE supplier_evaluations ADD [${name}] ${def};`, `Add supplier_evaluations.${name}`);
      }

      const columnsSupplierEvaluationScores = [
        ['evaluation_id', 'BIGINT'],
        ['criterion_code', 'NVARCHAR(30)'],
        ['score', 'TINYINT'],
        ['comment', 'NVARCHAR(MAX)'],
        ['created_at', 'DATETIME DEFAULT GETDATE()'],
        ['created_by', 'NVARCHAR(100)'],
        ['updated_at', 'DATETIME DEFAULT GETDATE()'],
        ['updated_by', 'NVARCHAR(100)'],
        ['deleted_at', 'DATETIME'],
        ['deleted_by', 'NVARCHAR(100)']
      ];
      for (const [name, def] of columnsSupplierEvaluationScores) {
        await safeQuery(`IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('supplier_evaluation_scores') AND name = '${name}') ALTER TABLE supplier_evaluation_scores ADD [${name}] ${def};`, `Add supplier_evaluation_scores.${name}`);
      }

      // 8. Copy legacy supplier data if old table `supplier` exists and new `suppliers` is empty
      await safeQuery(
        `
        IF OBJECT_ID('supplier', 'U') IS NOT NULL
           AND OBJECT_ID('suppliers', 'U') IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM suppliers)
        BEGIN
          INSERT INTO suppliers (supplier_code, name, phone, address, is_active)
          SELECT
            CONCAT('SUP', RIGHT(CONCAT('000', CAST(id AS NVARCHAR(10))), 3)),
            name,
            contact_info,
            address,
            CASE WHEN is_active = 1 THEN 1 ELSE 0 END
          FROM supplier;
        END
        `,
        'Migrate legacy supplier -> suppliers'
      );

      // 9. Seeding logic (Move to end)
      log('[MealService] Checking seeds...');

      const dishCount = await this.dataSource.query('SELECT COUNT(*) as count FROM dishes');
      if (dishCount[0].count === 0) {
        await safeQuery(`INSERT INTO dishes (dish_code, name, category, image_url) VALUES ('FOOD001', N'CÆ¡m tráº¯ng', 'com', 'https://api.lifetex.vn/static/canteen/com_trang.jpg'), ('FOOD002', N'SÆ°á»n xÃ o chua ngá»t', 'com', 'https://api.lifetex.vn/static/canteen/suon_xao.jpg');`, 'Seed dishes');
      }

      const supplierCount = await this.dataSource.query('SELECT COUNT(*) as count FROM suppliers');
      if (supplierCount[0].count === 0) {
        await safeQuery(`INSERT INTO suppliers (supplier_code, name, type) VALUES ('SUP001', N'NhÃ  báº¿p TÃ¢n Cáº£ng', 'cong_nghiep'), ('SUP002', N'CÃ´ng ty CP Suáº¥t Äƒn CÃ´ng nghiá»‡p', 'cong_nghiep');`, 'Seed suppliers');
      }

      const settingCount = await this.dataSource.query('SELECT COUNT(*) as count FROM system_settings');
      if (settingCount[0].count === 0) {
        await safeQuery(`INSERT INTO system_settings ([group], [key], value, value_type, label, description, is_public) VALUES ('meal_session', 'lunch_active', 'true', 'boolean', N'Bá»¯a trÆ°a', N'Bá»¯a trÆ°a cÃ³ hoáº¡t Ä‘á»™ng', 1);`, 'Seed setting');
      }

      log('[MealService] Database sync completed.');
    } catch (error) {
      log(`[MealService] onModuleInit FATAL error: ${error.stack}`);
    }
  }

  async findAllDishes() {
    return this.dishRepo.find({ where: { is_active: 1 } });
  }

  async findAllDishesSupplier(supplierId?: number) {
    const where: any = { is_active: 1 };
    if (supplierId) {
      where.supplier_id = supplierId;
    }
    return this.dishRepo.find({ where });
  }

  async getUnevaluatedDishes(supplierId: number, orderId?: number) {
    const dishQb = this.dishRepo.createQueryBuilder('d')
      .where('d.supplier_id = :supplierId', { supplierId })
      .andWhere('d.is_active = 1');

    if (orderId) {
      const order = await this.orderRepo.findOne({
        where: { id: orderId },
        select: ['menu_id']
      });
      if (order && order.menu_id) {
        dishQb.innerJoin('menu_items', 'mi', 'mi.dish_id = d.id AND mi.menu_id = :menuId', { menuId: order.menu_id });
      }
    }

    dishQb.andWhere((qb) => {
      const subQuery = qb.subQuery()
        .select('se.id')
        .from(SupplierEvaluationEntity, 'se')
        .where('se.dish_id = d.id')
        .andWhere("se.evaluation_status IN ('submitted', 'reviewed')")
        .andWhere('se.deleted_at IS NULL');

      if (orderId) {
        subQuery.andWhere('se.supplier_order_id = :orderId', { orderId });
      }

      return `NOT EXISTS ${subQuery.getQuery()}`;
    });

    return dishQb.getMany();
  }
  private slotToMealType(slot?: string) {
    const key = String(slot || '').toLowerCase();
    if (key === 'breakfast') return { id: 1, name: 'Bá»¯a sÃ¡ng' };
    if (key === 'lunch') return { id: 2, name: 'Bá»¯a trÆ°a' };
    if (key === 'dinner') return { id: 3, name: 'Bá»¯a tá»‘i' };
    return { id: 0, name: key || 'KhÃ¡c' };
  }

  private extractServingRange(servingTime?: string | null) {
    if (!servingTime) return { servingStartTime: null, servingEndTime: null };

    const match = servingTime.match(/(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/);
    if (!match) return { servingStartTime: null, servingEndTime: null };

    return {
      servingStartTime: match[1],
      servingEndTime: match[2],
    };
  }

  private toReviewMenuSummary(menu: MenuEntity) {
    const mealType = this.slotToMealType(menu.meal_slot);
    const dishNames = (menu.items || [])
      .map((item) => item?.dish?.name)
      .filter(Boolean);
    const menuSummary = menu.title_manual || dishNames.join(', ') || 'ChÆ°a cáº­p nháº­t thá»±c Ä‘Æ¡n';
    const servingRange = this.extractServingRange(menu.serving_time);
    const itemSuppliers = (menu.items || [])
      .map((item) => item?.supplier || item?.dish?.supplier)
      .filter(Boolean);
    const primarySupplier =
      menu.supplier || (itemSuppliers.length > 0 ? itemSuppliers[0] : null);
    (menu as any).supplier = menu.supplier || primarySupplier || null;
    const menuSummaryResolved = dishNames.join(', ') || menuSummary;

    return {
      id: menu.id,
      menuDate: menu.menu_date,
      mealTypeId: mealType.id,
      mealTypeName: mealType.name,
      supplierId: primarySupplier?.id || null,
      supplierName: menu.supplier?.name || 'ChÆ°a chá»n nhÃ  cung cáº¥p',
      menuSummary: menuSummaryResolved,
      status: menu.status,
      servingStartTime: servingRange.servingStartTime,
      servingEndTime: servingRange.servingEndTime,
      registerDeadlineAt: menu.register_deadline_at,
      cancelDeadlineAt: menu.cancel_deadline_at,
    };
  }

  async findMenusForReview(params: {
    status?: string;
    page?: number;
    pageSize?: number;
    mealDate?: string;
    mealTypeId?: number;
    supplierId?: number;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20;

    const query = this.menuRepo
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.items', 'item')
      .leftJoinAndSelect('item.dish', 'dish')
      .leftJoinAndSelect('item.supplier', 'itemSupplier')
      .leftJoinAndSelect('dish.supplier', 'dishSupplier')
      .leftJoinAndSelect('menu.supplier', 'supplier');

    if (params.status) {
      query.andWhere('menu.status = :status', { status: params.status });
    }
    if (params.mealDate) {
      query.andWhere('menu.menu_date = :mealDate', { mealDate: params.mealDate });
    }
    if (params.supplierId) {
      query.andWhere('(supplier.id = :supplierId OR itemSupplier.id = :supplierId OR dishSupplier.id = :supplierId)', {
        supplierId: params.supplierId,
      });
    }
    if (params.mealTypeId) {
      const slotMap: Record<number, string> = { 1: 'breakfast', 2: 'lunch', 3: 'dinner' };
      const mealSlot = slotMap[params.mealTypeId];
      if (mealSlot) query.andWhere('menu.meal_slot = :mealSlot', { mealSlot });
    }

    query.orderBy('menu.menu_date', 'DESC').addOrderBy('menu.meal_slot', 'ASC');
    query.skip((page - 1) * pageSize).take(pageSize);

    const [menus, total] = await query.getManyAndCount();

    return {
      data: menus.map((menu) => this.toReviewMenuSummary(menu)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async findMenuDetailForReview(menuId: number) {
    const menu = await this.menuRepo.findOne({
      where: { id: menuId },
      relations: ['items', 'items.supplier', 'items.dish', 'items.dish.supplier', 'supplier'],
    });

    if (!menu) return null;

    const base = this.toReviewMenuSummary(menu);
    return {
      ...base,
      note: menu.note || '',
      imageUrl: menu.image_url_manual || null,
      description: menu.description_manual || '',
      items: (menu.items || []).map((item) => ({
        id: item.id,
        dishId: item.dish_id,
        dishName: item.dish?.name || '',
        unit: item.unit,
        unitPriceSnapshot: item.unit_price_snapshot,
      })),
    };
  }

  async getMealReviewFilterOptions() {
    let departments: Array<{ id: string; name: string }> = [];

    try {
      const rows = await this.dataSource.query(`
        SELECT DISTINCT
          COALESCE(NULLIF(organization_code, ''), NULLIF(organization_name, ''), id) AS id,
          COALESCE(NULLIF(organization_name, ''), NULLIF(organization_code, ''), id) AS name
        FROM users
        WHERE
          COALESCE(NULLIF(organization_code, ''), NULLIF(organization_name, ''), id) IS NOT NULL
        ORDER BY name
      `);
      departments = rows.map((row: any) => ({
        id: String(row.id),
        name: String(row.name),
      }));
    } catch {
      // Fallback: at least return user IDs from registrations if users table is unavailable.
      const rows = await this.registrationRepo
        .createQueryBuilder('reg')
        .select('DISTINCT(reg.user_id)', 'id')
        .addSelect('DISTINCT(reg.user_id)', 'name')
        .orderBy('name', 'ASC')
        .getRawMany();

      departments = rows.map((row: any) => ({
        id: String(row.id),
        name: String(row.name),
      }));
    }

    const suppliers = await this.supplierRepo.find({ where: { is_active: 1 } });

    return {
      departments,
      suppliers: suppliers.map((supplier) => ({
        id: Number(supplier.id),
        name: supplier.name,
      })),
    };
  }

  async getMealReviewCriteria() {
    return [
      {
        id: 1,
        criteriaCode: 'taste',
        criteriaName: 'Kháº©u vá»‹',
        description: 'MÃ³n Äƒn ngon, vá»«a miá»‡ng, nÃªm náº¿m há»£p lÃ½',
        iconName: 'utensils',
        minScore: 1,
        maxScore: 5,
        isRequired: true,
        sortOrder: 1,
      },
      {
        id: 2,
        criteriaCode: 'hygiene',
        criteriaName: 'Vá»‡ sinh an toÃ n thá»±c pháº©m',
        description: 'Thá»©c Äƒn sáº¡ch sáº½, khu vá»±c Äƒn gá»n gÃ ng',
        iconName: 'shield-check',
        minScore: 1,
        maxScore: 5,
        isRequired: true,
        sortOrder: 2,
      },
      {
        id: 3,
        criteriaCode: 'portion',
        criteriaName: 'Kháº©u pháº§n',
        description: 'LÆ°á»£ng cÆ¡m, thá»©c Äƒn Ä‘á»§ no, phÃ¢n chia há»£p lÃ½',
        iconName: 'scales',
        minScore: 1,
        maxScore: 5,
        isRequired: true,
        sortOrder: 3,
      },
      {
        id: 4,
        criteriaCode: 'variety',
        criteriaName: 'Äa dáº¡ng mÃ³n',
        description: 'Thá»±c Ä‘Æ¡n phong phÃº, khÃ´ng láº·p láº¡i nhiá»u',
        iconName: 'salad',
        minScore: 1,
        maxScore: 5,
        isRequired: true,
        sortOrder: 4,
      },
      {
        id: 5,
        criteriaCode: 'service',
        criteriaName: 'Phá»¥c vá»¥',
        description: 'ThÃ¡i Ä‘á»™ phá»¥c vá»¥, thá»i gian chá», sáº¯p xáº¿p',
        iconName: 'handshake',
        minScore: 1,
        maxScore: 5,
        isRequired: true,
        sortOrder: 5,
      },
    ];
  }

  private mealTypeIdToSlot(mealTypeId?: number | null) {
    if (Number(mealTypeId) === 1) return 'breakfast';
    if (Number(mealTypeId) === 2) return 'lunch';
    if (Number(mealTypeId) === 3) return 'dinner';
    return null;
  }

  private normalizeScore(value: any) {
    const n = Number(value || 0);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(5, Math.round(n)));
  }

  private computeOverallScore(scores: {
    tasteScore?: any;
    hygieneScore?: any;
    portionScore?: any;
    varietyScore?: any;
    serviceScore?: any;
  }) {
    const values = [
      this.normalizeScore(scores.tasteScore),
      this.normalizeScore(scores.hygieneScore),
      this.normalizeScore(scores.portionScore),
      this.normalizeScore(scores.varietyScore),
      this.normalizeScore(scores.serviceScore),
    ];
    const total = values.reduce((sum, item) => sum + item, 0);
    return Number((total / values.length).toFixed(2));
  }

  private async enrichReviewRows(rows: any[], includeImages = true, includeReplies = true) {
    if (!rows.length) return [];

    const reviewIds = rows.map((r) => Number(r.id));
    const idList = reviewIds.join(',');
    let imagesByReview: Record<number, any[]> = {};
    let repliesByReview: Record<number, any[]> = {};

    if (includeImages && idList) {
      const images = await this.dataSource.query(`
        SELECT id, review_id, file_name, file_url, uploaded_at
        FROM meal_review_images
        WHERE review_id IN (${idList})
        ORDER BY id ASC
      `);
      imagesByReview = images.reduce((acc: Record<number, any[]>, item: any) => {
        const key = Number(item.review_id);
        if (!acc[key]) acc[key] = [];
        acc[key].push({
          id: Number(item.id),
          fileName: item.file_name,
          fileUrl: item.file_url,
          uploadedAt: item.uploaded_at,
        });
        return acc;
      }, {});
    }

    if (includeReplies && idList) {
      const replies = await this.dataSource.query(`
        SELECT r.id, r.review_id, r.reply_content, r.reply_type, r.is_official, r.replied_by, r.replied_at,
               u.name AS replied_by_name, u.organization_name AS replied_by_department
        FROM meal_review_replies r
        LEFT JOIN users u ON u.id = r.replied_by
        WHERE r.review_id IN (${idList})
        ORDER BY r.id ASC
      `);
      repliesByReview = replies.reduce((acc: Record<number, any[]>, item: any) => {
        const key = Number(item.review_id);
        if (!acc[key]) acc[key] = [];
        acc[key].push({
          id: Number(item.id),
          replyContent: item.reply_content,
          replyType: item.reply_type,
          isOfficial: Number(item.is_official) === 1,
          repliedAt: item.replied_at,
          repliedBy: {
            id: item.replied_by,
            fullName: item.replied_by_name || item.replied_by || 'NgÆ°á»i pháº£n há»“i',
            departmentName: item.replied_by_department || '',
          },
        });
        return acc;
      }, {});
    }

    return rows.map((row: any) => ({
      id: Number(row.id),
      menuId: Number(row.menu_id),
      reviewDate: row.review_date,
      mealTypeId: Number(row.meal_type_id || 0),
      supplierId: row.supplier_id ? Number(row.supplier_id) : null,
      tasteScore: Number(row.taste_score || 0),
      hygieneScore: Number(row.hygiene_score || 0),
      portionScore: Number(row.portion_score || 0),
      varietyScore: Number(row.variety_score || 0),
      serviceScore: Number(row.service_score || 0),
      overallScore: Number(row.overall_score || 0),
      commentText: row.comment_text || '',
      reviewStatus: row.review_status || 'pending_reply',
      hasReply: Number(row.has_reply || 0) === 1,
      hasImages: (imagesByReview[Number(row.id)] || []).length > 0 || Number(row.has_images || 0) === 1,
      submittedAt: row.submitted_at,
      updatedAt: row.updated_at,
      reviewer: {
        id: row.user_id,
        fullName: row.user_name || row.user_id,
        departmentName: row.user_department || '',
        teamName: '',
        avatarUrl: null,
        avatarText: String(row.user_name || row.user_id || 'U')
          .split(' ')
          .map((s: string) => s[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
      },
      scores: {
        tasteScore: Number(row.taste_score || 0),
        hygieneScore: Number(row.hygiene_score || 0),
        portionScore: Number(row.portion_score || 0),
        varietyScore: Number(row.variety_score || 0),
        serviceScore: Number(row.service_score || 0),
        overallScore: Number(row.overall_score || 0),
      },
      images: imagesByReview[Number(row.id)] || [],
      replies: repliesByReview[Number(row.id)] || [],
    }));
  }

  private buildMealReviewWhereSql(params: any) {
    const where: string[] = ['1=1'];
    const sqlParams: any[] = [];

    const param = (value: any) => {
      const idx = sqlParams.length;
      sqlParams.push(value);
      return `@${idx}`;
    };

    if (params.menuId) where.push(`r.menu_id = ${param(Number(params.menuId))}`);
    if (params.mealDate) where.push(`CONVERT(date, m.menu_date) = CONVERT(date, ${param(params.mealDate)})`);
    if (params.mealTypeId) {
      const mealSlot = this.mealTypeIdToSlot(Number(params.mealTypeId));
      if (mealSlot) where.push(`m.meal_slot = ${param(mealSlot)}`);
    }
    if (params.supplierId) {
      const supplierIdParam = param(Number(params.supplierId));
      where.push(`ISNULL(r.supplier_id, m.supplier_id) = ${supplierIdParam}`);
    }
    if (params.departmentId) {
      const p1 = param(params.departmentId);
      const p2 = param(params.departmentId);
      const p3 = param(params.departmentId);
      where.push(`(u.organization_code = ${p1} OR u.organization_name = ${p2} OR u.id = ${p3})`);
    }
    if (params.hasReply === false || params.hasReply === 'false') where.push('ISNULL(r.has_reply, 0) = 0');
    if (params.hasImages === true || params.hasImages === 'true') {
      where.push(
        `(ISNULL(r.has_images, 0) = 1 OR EXISTS (SELECT 1 FROM meal_review_images mri WHERE mri.review_id = r.id))`,
      );
    }
    if (params.maxScore) where.push(`ISNULL(r.overall_score, 0) <= ${param(Number(params.maxScore))}`);
    if (params.keyword) {
      const keyword = `%${String(params.keyword).trim()}%`;
      const k1 = param(keyword);
      const k2 = param(keyword);
      const k3 = param(keyword);
      where.push(`(ISNULL(u.name, '') LIKE ${k1} OR ISNULL(u.organization_name, '') LIKE ${k2} OR ISNULL(r.comment_text, '') LIKE ${k3})`);
    }

    return {
      whereSql: where.join(' AND '),
      sqlParams,
    };
  }

  async createMealReview(userId: string, dto: any) {
    const menuId = Number(dto.menuId);
    if (!menuId) throw new BadRequestException('Thiếu menuId.');

    const overallScore = this.computeOverallScore(dto);
    const now = new Date();
    const result = await this.dataSource.query(
      `INSERT INTO meal_reviews (
        menu_id, user_id, review_date, meal_type_id, supplier_id,
        taste_score, hygiene_score, portion_score, variety_score, service_score,
        overall_score, comment_text, review_status, has_reply, has_images, submitted_at, updated_at
      )
      OUTPUT INSERTED.id
      VALUES (
        @0, @1, @2, @3, @4,
        @5, @6, @7, @8, @9,
        @10, @11, 'pending_reply', 0, 0, @12, @12
      )`,
      [
        menuId,
        userId,
        dto.reviewDate || null,
        dto.mealTypeId ? Number(dto.mealTypeId) : null,
        dto.supplierId ? Number(dto.supplierId) : null,
        this.normalizeScore(dto.tasteScore),
        this.normalizeScore(dto.hygieneScore),
        this.normalizeScore(dto.portionScore),
        this.normalizeScore(dto.varietyScore),
        this.normalizeScore(dto.serviceScore),
        overallScore,
        dto.commentText || null,
        now,
      ],
    );
    const id = Number(result?.[0]?.id);
    return this.getMealReviewDetail(id);
  }

  async getMyCurrentReview(
    userId: string,
    opts: { menuId: number; includeImages?: boolean; includeReplies?: boolean },
  ) {
    if (!opts.menuId) return { exists: false, review: null, images: [], replies: [] };

    const rows = await this.dataSource.query(
      `SELECT TOP 1 r.*, u.name AS user_name, u.organization_name AS user_department
       FROM meal_reviews r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.user_id = @0 AND r.menu_id = @1
       ORDER BY r.id DESC`,
      [userId, opts.menuId],
    );

    if (!rows.length) return { exists: false, review: null, images: [], replies: [] };

    const [review] = await this.enrichReviewRows(rows, opts.includeImages !== false, opts.includeReplies === true);
    return {
      exists: true,
      review,
      images: review.images || [],
      replies: review.replies || [],
    };
  }

  async updateMyCurrentReview(userId: string, dto: any) {
    const menuId = Number(dto.menuId);
    if (!menuId) throw new BadRequestException('ThiÃ¡ÂºÂ¿u menuId.');

    const rows = await this.dataSource.query(
      'SELECT TOP 1 id FROM meal_reviews WHERE user_id = @0 AND menu_id = @1 ORDER BY id DESC',
      [userId, menuId],
    );
    if (!rows.length) {
      return this.createMealReview(userId, dto);
    }
    return this.updateReviewById(userId, Number(rows[0].id), dto);
  }

  async updateReviewById(userId: string, id: number, dto: any) {
    const review = await this.dataSource.query('SELECT TOP 1 * FROM meal_reviews WHERE id = @0', [id]);
    if (!review.length) throw new BadRequestException('KhÃ´ng tÃ¬m tháº¥y Ä‘Ã¡nh giÃ¡.');

    const overallScore = this.computeOverallScore(dto);
    const normalizedImageIds = Array.isArray(dto?.imageIds)
      ? dto.imageIds
        .map((item: any) => Number(item))
        .filter((item: number) => Number.isFinite(item) && item > 0)
      : [];
    const nextHasImages = normalizedImageIds.length > 0 ? 1 : 0;
    await this.dataSource.query(
      `UPDATE meal_reviews
       SET taste_score = @1,
           hygiene_score = @2,
           portion_score = @3,
           variety_score = @4,
           service_score = @5,
           overall_score = @6,
           comment_text = @7,
           has_images = @8,
           review_date = @9,
           meal_type_id = @10,
           supplier_id = @11,
           updated_at = @12
       WHERE id = @0`,
      [
        id,
        this.normalizeScore(dto.tasteScore),
        this.normalizeScore(dto.hygieneScore),
        this.normalizeScore(dto.portionScore),
        this.normalizeScore(dto.varietyScore),
        this.normalizeScore(dto.serviceScore),
        overallScore,
        dto.commentText || null,
        nextHasImages,
        dto.reviewDate || review?.[0]?.review_date || null,
        dto.mealTypeId ? Number(dto.mealTypeId) : review?.[0]?.meal_type_id || null,
        dto.supplierId ? Number(dto.supplierId) : review?.[0]?.supplier_id || null,
        new Date(),
      ],
    );

    if (normalizedImageIds.length === 0) {
      const existingImages = await this.dataSource.query(
        'SELECT id, file_path FROM meal_review_images WHERE review_id = @0',
        [id],
      );

      for (const image of existingImages) {
        const filePath = image?.file_path;
        if (filePath && fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch {
            // ignore file unlink error and continue deleting db rows
          }
        }
      }

      await this.dataSource.query('DELETE FROM meal_review_images WHERE review_id = @0', [id]);
      await this.dataSource.query(
        'UPDATE meal_reviews SET has_images = 0, updated_at = @1 WHERE id = @0',
        [id, new Date()],
      );
    }
    return this.getMealReviewDetail(id);
  }

  async getMealReviews(query: any) {
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.max(1, Number(query.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const { whereSql, sqlParams } = this.buildMealReviewWhereSql(query);
    const sortBy = String(query.sortBy || 'submittedAt');
    const sortOrder = String(query.sortOrder || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const sortField = sortBy === 'overallScore' ? 'r.overall_score' : 'r.submitted_at';

    const rows = await this.dataSource.query(
      `SELECT r.*, u.name AS user_name, u.organization_name AS user_department
       FROM meal_reviews r
       LEFT JOIN menus m ON m.id = r.menu_id
       LEFT JOIN users u ON u.id = r.user_id
       WHERE ${whereSql}
       ORDER BY ${sortField} ${sortOrder}
       OFFSET ${skip} ROWS FETCH NEXT ${pageSize} ROWS ONLY`,
      sqlParams,
    );

    const countRows = await this.dataSource.query(
      `SELECT COUNT(1) AS total
       FROM meal_reviews r
       LEFT JOIN menus m ON m.id = r.menu_id
       LEFT JOIN users u ON u.id = r.user_id
       WHERE ${whereSql}`,
      sqlParams,
    );
    const total = Number(countRows?.[0]?.total || 0);
    const data = await this.enrichReviewRows(rows, true, true);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async getMealReviewDetail(id: number) {
    const rows = await this.dataSource.query(
      `SELECT r.*, u.name AS user_name, u.organization_name AS user_department
       FROM meal_reviews r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.id = @0`,
      [id],
    );
    if (!rows.length) return null;
    const [review] = await this.enrichReviewRows(rows, true, true);
    return review;
  }

  async getMealReviewSummary(query: any) {
    const { whereSql, sqlParams } = this.buildMealReviewWhereSql(query);
    const rows = await this.dataSource.query(
      `SELECT
          COUNT(1) AS total_reviews,
          AVG(CAST(ISNULL(r.overall_score, 0) AS FLOAT)) AS average_score,
          SUM(CASE WHEN ISNULL(r.overall_score, 0) >= 4 THEN 1 ELSE 0 END) AS satisfied_count,
          SUM(CASE WHEN ISNULL(r.overall_score, 0) >= 3 AND ISNULL(r.overall_score, 0) < 4 THEN 1 ELSE 0 END) AS neutral_count,
          SUM(CASE WHEN ISNULL(r.overall_score, 0) < 3 THEN 1 ELSE 0 END) AS unsatisfied_count
       FROM meal_reviews r
       LEFT JOIN menus m ON m.id = r.menu_id
       LEFT JOIN users u ON u.id = r.user_id
       WHERE ${whereSql}`,
      sqlParams,
    );

    const totalReviews = Number(rows?.[0]?.total_reviews || 0);
    const averageScore = Number(Number(rows?.[0]?.average_score || 0).toFixed(1));
    const satisfiedCount = Number(rows?.[0]?.satisfied_count || 0);
    const neutralCount = Number(rows?.[0]?.neutral_count || 0);
    const unsatisfiedCount = Number(rows?.[0]?.unsatisfied_count || 0);

    const totalEligibleRows = query.menuId
      ? await this.dataSource.query(
        'SELECT COUNT(1) AS total FROM meal_registrations WHERE menu_id = @0 AND status = @1',
        [Number(query.menuId), 'registered'],
      )
      : [{ total: totalReviews }];
    const totalEligibleUsers = Number(totalEligibleRows?.[0]?.total || totalReviews);
    const responseRate = totalEligibleUsers > 0 ? Number(((totalReviews / totalEligibleUsers) * 100).toFixed(1)) : 0;

    return {
      averageScore,
      totalReviews,
      totalEligibleUsers,
      responseRate,
      satisfiedCount,
      neutralCount,
      unsatisfiedCount,
      satisfiedRate: totalReviews > 0 ? Number(((satisfiedCount / totalReviews) * 100).toFixed(1)) : 0,
      neutralRate: totalReviews > 0 ? Number(((neutralCount / totalReviews) * 100).toFixed(1)) : 0,
      unsatisfiedRate: totalReviews > 0 ? Number(((unsatisfiedCount / totalReviews) * 100).toFixed(1)) : 0,
    };
  }

  async getMealReviewCriteriaAverages(query: any) {
    const { whereSql, sqlParams } = this.buildMealReviewWhereSql(query);
    const rows = await this.dataSource.query(
      `SELECT
          AVG(CAST(ISNULL(r.taste_score, 0) AS FLOAT)) AS taste_average,
          AVG(CAST(ISNULL(r.hygiene_score, 0) AS FLOAT)) AS hygiene_average,
          AVG(CAST(ISNULL(r.portion_score, 0) AS FLOAT)) AS portion_average,
          AVG(CAST(ISNULL(r.variety_score, 0) AS FLOAT)) AS variety_average,
          AVG(CAST(ISNULL(r.service_score, 0) AS FLOAT)) AS service_average
       FROM meal_reviews r
       LEFT JOIN menus m ON m.id = r.menu_id
       LEFT JOIN users u ON u.id = r.user_id
       WHERE ${whereSql}`,
      sqlParams,
    );
    return {
      tasteAverage: Number(Number(rows?.[0]?.taste_average || 0).toFixed(1)),
      hygieneAverage: Number(Number(rows?.[0]?.hygiene_average || 0).toFixed(1)),
      portionAverage: Number(Number(rows?.[0]?.portion_average || 0).toFixed(1)),
      varietyAverage: Number(Number(rows?.[0]?.variety_average || 0).toFixed(1)),
      serviceAverage: Number(Number(rows?.[0]?.service_average || 0).toFixed(1)),
    };
  }

  async createMealReviewReply(userId: string, reviewId: number, dto: any) {
    const review = await this.dataSource.query('SELECT TOP 1 id FROM meal_reviews WHERE id = @0', [reviewId]);
    if (!review.length) throw new BadRequestException('KhÃ´ng tÃ¬m tháº¥y Ä‘Ã¡nh giÃ¡.');

    const result = await this.dataSource.query(
      `INSERT INTO meal_review_replies (review_id, reply_content, reply_type, is_official, replied_by, replied_at)
       OUTPUT INSERTED.id
       VALUES (@0, @1, @2, @3, @4, @5)`,
      [
        reviewId,
        dto.replyContent || '',
        dto.replyType || 'kitchen_reply',
        dto.isOfficial === false ? 0 : 1,
        userId,
        new Date(),
      ],
    );
    await this.dataSource.query(
      `UPDATE meal_reviews SET has_reply = 1, review_status = 'replied', updated_at = @1 WHERE id = @0`,
      [reviewId, new Date()],
    );
    return this.getMealReviewReplies(reviewId).then((items) =>
      items.find((item) => Number(item.id) === Number(result?.[0]?.id)) || items[items.length - 1],
    );
  }

  async getMealReviewReplies(reviewId: number) {
    const rows = await this.dataSource.query(
      `SELECT r.id, r.review_id, r.reply_content, r.reply_type, r.is_official, r.replied_by, r.replied_at,
              u.name AS replied_by_name, u.organization_name AS replied_by_department
       FROM meal_review_replies r
       LEFT JOIN users u ON u.id = r.replied_by
       WHERE r.review_id = @0
       ORDER BY r.id ASC`,
      [reviewId],
    );

    return rows.map((row: any) => ({
      id: Number(row.id),
      reviewId: Number(row.review_id),
      replyContent: row.reply_content,
      replyType: row.reply_type,
      isOfficial: Number(row.is_official) === 1,
      repliedAt: row.replied_at,
      repliedBy: {
        id: row.replied_by,
        fullName: row.replied_by_name || row.replied_by || 'NgÆ°á»i pháº£n há»“i',
        departmentName: row.replied_by_department || '',
      },
    }));
  }

  async uploadMealReviewImages(
    userId: string,
    reviewId: number,
    files: Array<Express.Multer.File>,
    baseUrl: string,
  ) {
    if (!files?.length) return [];

    const review = await this.dataSource.query('SELECT TOP 1 id FROM meal_reviews WHERE id = @0', [reviewId]);
    if (!review.length) throw new BadRequestException('KhÃ´ng tÃ¬m tháº¥y Ä‘Ã¡nh giÃ¡.');

    const uploadDir = path.join(process.cwd(), 'upload', 'meal-review');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const inserted: any[] = [];
    for (const file of files) {
      const safeName = String(file.originalname || 'image').replace(/[^\w.\-]/g, '_');
      const ext = safeName.includes('.') ? safeName.slice(safeName.lastIndexOf('.')) : '.jpg';
      const fileName = `review_${reviewId}_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
      const fullPath = path.join(uploadDir, fileName);
      fs.writeFileSync(fullPath, file.buffer);

      const publicPath = `/upload/meal-review/${fileName}`;
      const fileUrl = `${baseUrl}${publicPath}`;

      const result = await this.dataSource.query(
        `INSERT INTO meal_review_images (review_id, file_name, file_url, file_path, uploaded_by, uploaded_at)
         OUTPUT INSERTED.id
         VALUES (@0, @1, @2, @3, @4, @5)`,
        [reviewId, safeName, fileUrl, fullPath, userId, new Date()],
      );

      inserted.push({
        id: Number(result?.[0]?.id),
        reviewId,
        fileName: safeName,
        fileUrl,
      });
    }

    await this.dataSource.query(
      `UPDATE meal_reviews SET has_images = 1, updated_at = @1 WHERE id = @0`,
      [reviewId, new Date()],
    );
    return inserted;
  }

  async deleteMealReviewImage(userId: string, imageId: number) {
    const rows = await this.dataSource.query(
      'SELECT TOP 1 id, review_id, file_path FROM meal_review_images WHERE id = @0',
      [imageId],
    );
    if (!rows.length) throw new BadRequestException('KhÃ´ng tÃ¬m tháº¥y áº£nh.');

    const image = rows[0];
    await this.dataSource.query('DELETE FROM meal_review_images WHERE id = @0', [imageId]);
    if (image.file_path && fs.existsSync(image.file_path)) {
      try {
        fs.unlinkSync(image.file_path);
      } catch {
        // ignore unlink error
      }
    }

    const remain = await this.dataSource.query(
      'SELECT COUNT(1) AS total FROM meal_review_images WHERE review_id = @0',
      [Number(image.review_id)],
    );
    if (Number(remain?.[0]?.total || 0) === 0) {
      await this.dataSource.query(
        'UPDATE meal_reviews SET has_images = 0, updated_at = @1 WHERE id = @0',
        [Number(image.review_id), new Date()],
      );
    }

    return { success: true };
  }

  async exportMealReviewsExcel(query: any) {
    const reviews = await this.getMealReviews({ ...query, page: 1, pageSize: 1000 });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Meal Reviews');
    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'NgÆ°á»i Ä‘Ã¡nh giÃ¡', key: 'reviewer', width: 28 },
      { header: 'PhÃ²ng ban', key: 'department', width: 24 },
      { header: 'Äiá»ƒm TB', key: 'overall', width: 12 },
      { header: 'Kháº©u vá»‹', key: 'taste', width: 10 },
      { header: 'Vá»‡ sinh', key: 'hygiene', width: 10 },
      { header: 'Kháº©u pháº§n', key: 'portion', width: 10 },
      { header: 'Äa dáº¡ng', key: 'variety', width: 10 },
      { header: 'Phá»¥c vá»¥', key: 'service', width: 10 },
      { header: 'Nháº­n xÃ©t', key: 'comment', width: 60 },
      { header: 'Thá»i gian', key: 'submittedAt', width: 24 },
    ];

    (reviews.data || []).forEach((item: any) => {
      sheet.addRow({
        id: item.id,
        reviewer: item.reviewer?.fullName || '',
        department: item.reviewer?.departmentName || '',
        overall: item.scores?.overallScore || 0,
        taste: item.scores?.tasteScore || 0,
        hygiene: item.scores?.hygieneScore || 0,
        portion: item.scores?.portionScore || 0,
        variety: item.scores?.varietyScore || 0,
        service: item.scores?.serviceScore || 0,
        comment: item.commentText || '',
        submittedAt: item.submittedAt ? moment(item.submittedAt).format('YYYY-MM-DD HH:mm:ss') : '',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      fileName: `meal-review-${moment().format('YYYYMMDD-HHmmss')}.xlsx`,
      buffer,
    };
  }

  async getMealReviewPrintReport(query: any) {
    const summary = await this.getMealReviewSummary(query);
    const menuList = await this.findMenusForReview({
      status: 'published',
      page: 1,
      pageSize: 1,
      mealDate: query.mealDate,
      mealTypeId: query.mealTypeId ? Number(query.mealTypeId) : undefined,
      supplierId: query.supplierId ? Number(query.supplierId) : undefined,
    });
    const menu = menuList.data?.[0] || null;

    return {
      header: {
        mealDate: menu?.menuDate || query.mealDate || '',
        mealTypeName: menu?.mealTypeName || '',
        supplierName: menu?.supplierName || '',
        menuSummary: menu?.menuSummary || '',
      },
      summary,
    };
  }

  async getSupplierEvaluationsOverview() {
    // 1. Total & Rating Buckets from submitted/reviewed evaluations
    const evalStats = await this.evaluationRepo
      .createQueryBuilder('e')
      .select('COUNT(e.id)', 'totalCount')
      .addSelect('SUM(CASE WHEN e.overall_score >= 4 THEN 1 ELSE 0 END)', 'excellentCount')
      .addSelect('SUM(CASE WHEN e.overall_score >= 3 AND e.overall_score < 4 THEN 1 ELSE 0 END)', 'goodCount')
      .addSelect('SUM(CASE WHEN e.overall_score < 3 THEN 1 ELSE 0 END)', 'needImprovementCount')
      .where("e.evaluation_status IN ('submitted', 'reviewed')")
      .getRawOne();

    // 2. Pending Evaluations (Orders delivered but not yet evaluated)
    const pendingCount = await this.orderRepo
      .createQueryBuilder('o')
      .leftJoin(SupplierEvaluationEntity, 'e', 'e.supplier_order_id = o.id')
      .where("o.status = 'delivered'")
      .andWhere('e.id IS NULL')
      .getCount();

    return {
      totalEvaluations: Number(evalStats.totalCount || 0),
      pendingEvaluations: Number(pendingCount || 0),
      excellentCount: Number(evalStats.excellentCount || 0),
      goodCount: Number(evalStats.goodCount || 0),
      needImprovementCount: Number(evalStats.needImprovementCount || 0),
    };
  }

  async findAllSuppliers(params: any) {
    log('Entering findAllSuppliers');
    try {
      const result = await this.supplierRepo.find({ where: { is_active: 1 } });
      log(`findAllSuppliers success. Found ${result.length} suppliers.`);
      return result;
    } catch (error) {
      log(`findAllSuppliers error: ${error.message}`);
      log(error.stack);
      throw error;
    }
  }

  async getSuppliersDashboardSummary(query: DashboardFilterDto): Promise<DashboardSummaryDto> {
    const emptyResponse: DashboardSummaryDto = {
      kpis: {
        totalSuppliers: { value: 0, trend: 'neutral', trendValue: 0 },
        monthlyOrders: { value: 0, trend: 'neutral', trendValue: 0 },
        mealsProvided: { value: 0, trend: 'neutral', trendValue: 0 },
        totalCost: { value: 0, trend: 'neutral', trendValue: 0 },
        overallRating: { value: 0, trend: 'neutral', trendValue: 0 },
      },
      ranking: [],
      trends: { months: [], series: [] },
      costDistribution: [],
      orderQuantityByMeal: [],
      criteriaAverages: [],
      recentActivities: [],
      alerts: [],
      comparisonTable: [],
    };

    try {
      const { startDate, endDate, supplierId, contractType } = query;
      const start = (startDate && moment(startDate).isValid())
        ? moment(startDate).startOf('day')
        : moment().startOf('month');
      const end = (endDate && moment(endDate).isValid())
        ? moment(endDate).endOf('day')
        : moment().endOf('day');
      const startStr = start.format('YYYY-MM-DD');
      const endStr = end.format('YYYY-MM-DD');

      const querySuppliers = this.supplierRepo.createQueryBuilder('s').where('s.is_active = 1');
      if (contractType) {
        querySuppliers.innerJoin('s.contracts', 'c', 'c.deleted_at IS NULL').andWhere('c.contract_type = :contractType', { contractType });
      }
      if (supplierId) {
        querySuppliers.andWhere('s.id = :supplierId', { supplierId });
      }

      const supplierRows = await querySuppliers
        .clone()
        .select('DISTINCT s.id', 'id')
        .getRawMany();
      const supplierIds = supplierRows.map((row) => Number(row.id)).filter((id) => Number.isFinite(id));
      const totalSuppliersCount = supplierIds.length;

      const applySupplierScope = (qb: any, field: string) => {
        if (supplierIds.length > 0) {
          qb.andWhere(`${field} IN (:...supplierIds)`, { supplierIds });
        } else {
          qb.andWhere('1 = 0');
        }
      };

      const queryOrders = this.orderRepo.createQueryBuilder('o')
        .where('o.order_date BETWEEN :start AND :end', { start: startStr, end: endStr })
        .andWhere('o.deleted_at IS NULL');
      applySupplierScope(queryOrders, 'o.supplier_id');
      const orders = await queryOrders.getMany();
      const monthlyOrdersCount = orders.length;
      const mealsProvided = orders.reduce((sum, o) => sum + (Number(o.delivered_qty) || Number(o.expected_qty) || 0), 0);
      const totalCost = orders.reduce((sum, o) => sum + ((Number(o.delivered_qty) || Number(o.expected_qty) || 0) * Number(o.unit_price || 0)), 0);

      const queryEval = this.evaluationRepo.createQueryBuilder('e')
        .where('e.created_at BETWEEN :start AND :end', { start: start.toDate(), end: end.toDate() })
        .andWhere('e.deleted_at IS NULL');
      applySupplierScope(queryEval, 'e.supplier_id');
      const evaluations = await queryEval.getMany();
      const overallRating = evaluations.length > 0
        ? evaluations.reduce((sum, e) => sum + Number(e.overall_score || 0), 0) / evaluations.length
        : 0;

      const queryRanking = this.supplierRepo.createQueryBuilder('s')
        .leftJoin('s.orders', 'o', 'o.order_date BETWEEN :start AND :end AND o.deleted_at IS NULL', { start: startStr, end: endStr })
        .select('s.id', 'id')
        .addSelect('s.name', 'name')
        .addSelect('s.logo_url', 'logo_url')
        .addSelect('COUNT(o.id)', 'orderCount')
        .addSelect('SUM(CASE WHEN o.delivered_qty IS NOT NULL THEN o.delivered_qty ELSE o.expected_qty END)', 'mealCount')
        .addSelect('SUM((CASE WHEN o.delivered_qty IS NOT NULL THEN o.delivered_qty ELSE o.expected_qty END) * ISNULL(o.unit_price, 0))', 'revenue')
        .addSelect('s.rating_avg_cached', 'rating')
        .where('s.is_active = 1')
        .groupBy('s.id, s.name, s.logo_url, s.rating_avg_cached')
        .orderBy('s.rating_avg_cached', 'DESC');
      applySupplierScope(queryRanking, 's.id');
      const rankingRaw = await queryRanking.getRawMany();
      const ranking = rankingRaw.map((r) => ({
        id: Number(r.id),
        name: String(r.name || ''),
        logo_url: r.logo_url,
        orderCount: Number(r.orderCount || 0),
        mealCount: Number(r.mealCount || 0),
        revenue: Number(r.revenue || 0),
        rating: Number(r.rating || 0),
      }));

      const monthRanges: Array<{ label: string; from: Date; to: Date }> = [];
      let monthCursor = start.clone().startOf('month');
      const monthEnd = end.clone().startOf('month');
      while (monthCursor.isSameOrBefore(monthEnd, 'month')) {
        monthRanges.push({
          label: monthCursor.format('MM/YYYY'),
          from: monthCursor.clone().startOf('month').toDate(),
          to: monthCursor.clone().endOf('month').toDate(),
        });
        monthCursor = monthCursor.clone().add(1, 'month');
      }
      const normalizedMonthRanges = monthRanges.length > 0 ? monthRanges.slice(-6) : [{
        label: start.format('MM/YYYY'),
        from: start.clone().startOf('month').toDate(),
        to: start.clone().endOf('month').toDate(),
      }];
      const trendsMonths = normalizedMonthRanges.map((m) => m.label);
      const trendSeries = await Promise.all(
        ranking.slice(0, 3).map(async (s) => {
          const data = await Promise.all(
            normalizedMonthRanges.map(async (m) => {
              const row = await this.evaluationRepo
                .createQueryBuilder('e')
                .select('AVG(CAST(e.overall_score AS FLOAT))', 'avg')
                .where('e.supplier_id = :supplierId', { supplierId: s.id })
                .andWhere('e.created_at BETWEEN :start AND :end', { start: m.from, end: m.to })
                .andWhere('e.deleted_at IS NULL')
                .getRawOne();
              return Number(Number(row?.avg || 0).toFixed(1));
            }),
          );
          return { supplierName: s.name, data };
        }),
      );

      const costDistQuery = this.supplierRepo.createQueryBuilder('s')
        .leftJoin('s.contracts', 'c', 'c.deleted_at IS NULL')
        .select('s.name', 'name')
        .addSelect('SUM(ISNULL(c.value_amount, 0))', 'total')
        .where('s.is_active = 1')
        .groupBy('s.name');
      applySupplierScope(costDistQuery, 's.id');
      if (contractType) {
        costDistQuery.andWhere('c.contract_type = :contractType', { contractType });
      }
      const costDistRaw = await costDistQuery.getRawMany();
      const totalCostDist = costDistRaw.reduce((sum, r) => sum + Number(r.total || 0), 0);
      const costDistribution = costDistRaw
        .map((r) => ({
          name: String(r.name || ''),
          value: Number(r.total || 0),
          percentage: totalCostDist > 0 ? Math.round((Number(r.total || 0) / totalCostDist) * 100) : 0,
        }))
        .filter((item) => item.value > 0);

      const orderQtyQuery = this.orderRepo.createQueryBuilder('o')
        .innerJoin('o.supplier', 's')
        .select('s.name', 'supplierName')
        .addSelect('o.meal_slot', 'mealSlot')
        .addSelect('COUNT(o.id)', 'count')
        .where('o.order_date BETWEEN :start AND :end', { start: startStr, end: endStr })
        .andWhere('o.deleted_at IS NULL')
        .groupBy('s.name, o.meal_slot');
      applySupplierScope(orderQtyQuery, 'o.supplier_id');
      const orderQtyRaw = await orderQtyQuery.getRawMany();
      const orderQtyByMealMap = new Map<string, { supplierName: string; breakfast: number; lunch: number; dinner: number }>();
      orderQtyRaw.forEach((r) => {
        if (!orderQtyByMealMap.has(r.supplierName)) {
          orderQtyByMealMap.set(r.supplierName, { supplierName: r.supplierName, breakfast: 0, lunch: 0, dinner: 0 });
        }
        const item = orderQtyByMealMap.get(r.supplierName);
        if (!item) return;
        if (r.mealSlot === 'breakfast') item.breakfast = Number(r.count || 0);
        if (r.mealSlot === 'lunch') item.lunch = Number(r.count || 0);
        if (r.mealSlot === 'dinner') item.dinner = Number(r.count || 0);
      });
      const orderQuantityByMeal = Array.from(orderQtyByMealMap.values());

      const criteriaQuery = this.evaluationScoreRepo.createQueryBuilder('es')
        .innerJoin('es.evaluation', 'e')
        .select('es.criterion_code', 'code')
        .addSelect('AVG(CAST(es.score AS FLOAT))', 'avg')
        .where('e.created_at BETWEEN :start AND :end', { start: start.toDate(), end: end.toDate() })
        .andWhere('e.deleted_at IS NULL')
        .groupBy('es.criterion_code')
        .orderBy('es.criterion_code', 'ASC');
      applySupplierScope(criteriaQuery, 'e.supplier_id');
      const criteriaRaw = await criteriaQuery.getRawMany();
      const criteriaAverages = criteriaRaw.map((c) => ({
        code: String(c.code || ''),
        name: String(c.code || ''),
        value: Number(Number(c.avg || 0).toFixed(1)),
      }));

      const recentEvalQuery = this.evaluationRepo.createQueryBuilder('e')
        .leftJoinAndSelect('e.supplier', 'supplier')
        .where('e.created_at BETWEEN :start AND :end', { start: start.toDate(), end: end.toDate() })
        .andWhere('e.deleted_at IS NULL')
        .orderBy('e.created_at', 'DESC')
        .take(5);
      applySupplierScope(recentEvalQuery, 'e.supplier_id');
      const recentEvals = await recentEvalQuery.getMany();
      const recentActivities = recentEvals.map((ev) => ({
        id: Number(ev.id),
        supplierId: Number(ev.supplier_id),
        type: 'evaluation',
        title: ev.supplier?.name || 'Nha cung cap',
        description: `Diem danh gia: ${Number(ev.overall_score || 0)}. Ghi chu: ${ev.comment || 'N/A'}`,
        timeLabel: moment(ev.created_at).fromNow(),
        icon: 'star',
      }));

      const lowRatingQuery = this.supplierRepo.createQueryBuilder('s')
        .where('s.is_active = 1')
        .andWhere('s.rating_avg_cached > 0')
        .andWhere('s.rating_avg_cached <= 3.5')
        .take(3);
      applySupplierScope(lowRatingQuery, 's.id');
      const lowRatingSuppliers = await lowRatingQuery.getMany();
      const alerts: DashboardSummaryDto['alerts'] = lowRatingSuppliers.map((s) => ({
        id: Number(s.id),
        supplierId: Number(s.id),
        type: 'error',
        title: `Hieu suat thap: ${s.name}`,
        description: `Diem trung binh hien tai la ${Number(s.rating_avg_cached || 0)}.`,
        actionLabel: 'Xem chi tiet',
      }));

      const expiringContractsQuery = this.contractRepo.createQueryBuilder('c')
        .leftJoinAndSelect('c.supplier', 'supplier')
        .where('c.status = :status', { status: 'active' })
        .andWhere('c.deleted_at IS NULL')
        .andWhere('c.end_date BETWEEN :start AND :end', {
          start: moment().format('YYYY-MM-DD'),
          end: moment().add(15, 'days').format('YYYY-MM-DD'),
        })
        .take(2);
      applySupplierScope(expiringContractsQuery, 'c.supplier_id');
      if (contractType) {
        expiringContractsQuery.andWhere('c.contract_type = :contractType', { contractType });
      }
      const expiringContracts = await expiringContractsQuery.getMany();
      expiringContracts.forEach((c) => {
        alerts.push({
          id: Number(c.id) + 1000,
          supplierId: Number(c.supplier_id),
          type: 'warning',
          title: `Sap het han hop dong: ${c.supplier?.name || ''}`,
          description: `Hop dong ${c.contract_no} het han ngay ${moment(c.end_date).format('DD/MM/YYYY')}.`,
          actionLabel: 'Gia han',
        });
      });

      return {
        kpis: {
          totalSuppliers: { value: totalSuppliersCount, trend: 'neutral', trendValue: 0 },
          monthlyOrders: { value: monthlyOrdersCount, trend: 'neutral', trendValue: 0 },
          mealsProvided: { value: mealsProvided, trend: 'neutral', trendValue: 0 },
          totalCost: { value: totalCost, trend: 'neutral', trendValue: 0 },
          overallRating: { value: Number(overallRating.toFixed(1)), trend: 'neutral', trendValue: 0 },
        },
        ranking: ranking.map(({ revenue, ...rest }) => rest),
        trends: {
          months: trendsMonths,
          series: trendSeries,
        },
        costDistribution,
        orderQuantityByMeal,
        criteriaAverages,
        recentActivities,
        alerts,
        comparisonTable: ranking.map((r) => {
          const ratingValue = Number(r.rating || 0);
          return {
            id: r.id,
            name: r.name,
            orderCount: r.orderCount,
            mealCount: r.mealCount,
            revenue: Number(r.revenue || 0),
            rating: ratingValue,
            qualityRating: ratingValue,
            ontimeRating: ratingValue,
            trendValue: 0,
            performance: ratingValue > 0 ? Math.round((ratingValue / 5) * 100) : 0,
          };
        }),
      };
    } catch (error) {
      log(`getSuppliersDashboardSummary error: ${error.message}`);
      return emptyResponse;
    }
  }
  async getSuppliersOverview(): Promise<SupplierOverviewDto> {
    log('Entering getSuppliersOverview');
    try {
      const suppliers = await this.supplierRepo.find({
        where: { is_active: 1 }
      });

      const now = moment().startOf('day');
      const expiringSoonThreshold = moment().add(3, 'days').endOf('day');

      let active = 0;
      let expiringSoon = 0;
      let expired = 0;

      suppliers.forEach(s => {
        if (!s.contract_end_at_cached) {
          // If no contract date, consider it active if status is 'active' or default to active
          if (s.contract_status_cached === 'expired') expired++;
          else active++;
          return;
        }

        const endDate = moment(s.contract_end_at_cached);
        if (endDate.isBefore(now) || s.contract_status_cached === 'expired') {
          expired++;
        } else if (endDate.isSameOrBefore(expiringSoonThreshold)) {
          expiringSoon++;
        } else {
          active++;
        }
      });

      const result = {
        total: suppliers.length,
        active,
        expiringSoon,
        expired,
      };

      log(`getSuppliersOverview success: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      log(`getSuppliersOverview error: ${error.message}`);
      throw error;
    }
  }

  async getSupplierDetail(id: number): Promise<SupplierDetailDto> {
    log(`Entering getSupplierDetail for ID ${id}`);
    try {
      const supplier = await this.supplierRepo.findOne({ where: { id } });
      if (!supplier) throw new BadRequestException(`Supplier ID ${id} not found`);

      const [contracts, evaluations, orders] = await Promise.all([
        this.contractRepo.count({ where: { supplier_id: id } }),
        this.evaluationRepo.count({ where: { supplier_id: id } }),
        this.orderRepo.count({ where: { supplier_id: id } }),
      ]);

      const totalValueResult = await this.contractRepo
        .createQueryBuilder('c')
        .select('SUM(c.value_amount)', 'total')
        .where('c.supplier_id = :id', { id })
        .getRawOne();

      return {
        id: Number(supplier.id),
        name: supplier.name,
        supplier_code: supplier.supplier_code,
        type: supplier.type,
        tax_code: supplier.tax_code,
        address: supplier.address,
        phone: supplier.phone,
        email: supplier.email,
        representative_name: supplier.representative_name,
        logo_url: supplier.logo_url,
        is_active: supplier.is_active,
        rating_avg: Number(supplier.rating_avg_cached || 0),
        rating_count: Number(supplier.rating_count_cached || 0),
        total_contract_value: Number(totalValueResult?.total || 0),
        tab_counts: {
          contracts,
          evaluations,
          orders,
        },
      };
    } catch (error) {
      log(`getSupplierDetail error: ${error.message}`);
      throw error;
    }
  }

  async getSupplierContracts(id: number): Promise<SupplierContractListItemDto[]> {
    log(`Entering getSupplierContracts for ID ${id}`);
    try {
      const contracts = await this.contractRepo.find({
        where: { supplier_id: id },
        order: { end_date: 'DESC' }
      });

      const now = moment().startOf('day');

      return contracts.map(c => {
        const endDate = moment(c.end_date);
        const remainingDays = endDate.diff(now, 'days');

        return {
          id: Number(c.id),
          contract_no: c.contract_no,
          contract_type: c.contract_type,
          start_date: c.start_date,
          end_date: c.end_date,
          value_amount: Number(c.value_amount),
          status: c.status,
          remaining_days: Math.max(0, remainingDays),
        };
      });
    } catch (error) {
      log(`getSupplierContracts error: ${error.message}`);
      throw error;
    }
  }

  async getSupplierPrices(supplierId: number, query: any = {}): Promise<any[]> {
    log(`Entering getSupplierPrices for Supplier ${supplierId}`);
    try {
      const qb = this.dishRepo.createQueryBuilder('d');
      qb.where('d.supplier_id = :supplierId', { supplierId });
      qb.andWhere('d.is_active = 1');
      return await qb.getMany();
    } catch (error) {
      log(`getSupplierPrices error: ${error.message}`);
      throw error;
    }
  }

  async getSupplierEvaluations(supplierId: number): Promise<any[]> {
    log(`Entering getSupplierEvaluations for Supplier ${supplierId}`);
    try {
      return await this.evaluationRepo.find({
        where: { supplier_id: supplierId },
        relations: ['scores'],
        order: { created_at: 'DESC' }
      });
    } catch (error) {
      log(`getSupplierEvaluations error: ${error.message}`);
      throw error;
    }
  }

  async getSupplierOrders(supplierId: number, query: any = {}): Promise<any> {
    log(`Entering getSupplierOrders for Supplier ${supplierId}`);
    try {
      const page = Number(query.page || 1);
      const limit = Number(query.limit || 20);
      const skip = (page - 1) * limit;
      const start = query.startDate && moment(query.startDate).isValid()
        ? moment(query.startDate).startOf('day')
        : null;
      const end = query.endDate && moment(query.endDate).isValid()
        ? moment(query.endDate).endOf('day')
        : null;
      const startStr = start ? start.format('YYYY-MM-DD') : null;
      const endStr = end ? end.format('YYYY-MM-DD') : null;
      const hasDateFilter = Boolean(startStr && endStr);

      // 1. Get summary stats
      const summaryQuery = this.orderRepo
        .createQueryBuilder('o')
        .select('COUNT(o.id)', 'total_orders')
        .addSelect('SUM(o.expected_qty)', 'total_qty')
        .addSelect('SUM(o.expected_qty * o.unit_price)', 'total_amount')
        .addSelect('AVG(CAST(o.expected_qty AS FLOAT))', 'avg_qty_per_order')
        .where('o.supplier_id = :supplierId', { supplierId })
        .andWhere('o.deleted_at IS NULL');
      if (hasDateFilter && startStr && endStr) {
        summaryQuery.andWhere('o.order_date BETWEEN :startDate AND :endDate', {
          startDate: startStr,
          endDate: endStr,
        });
      }
      const summaryStats = await summaryQuery.getRawOne();

      // 2. Get paginated list
      const whereClause: any = { supplier_id: supplierId, deleted_at: null };
      if (hasDateFilter && startStr && endStr) {
        whereClause.order_date = Between(startStr, endStr) as any;
      }
      let [items, total] = await this.orderRepo.findAndCount({
        where: whereClause,
        relations: ['menu', 'menu.items', 'menu.items.dish'],
        order: { order_date: 'DESC' },
        skip,
        take: limit,
      });

      // 3. Calculate total_amount manually for all items
      items = items.map(i => {
        (i as any).total_amount = Number(i.expected_qty || 0) * Number(i.unit_price || 0);
        return i;
      });

      // 4. Try to attach evaluations if table exists (optional)
      try {
        const itemIds = items.map(i => i.id);
        if (itemIds.length > 0) {
          const evaluations = await this.evaluationRepo.find({
            where: { supplier_order_id: In(itemIds.map(id => Number(id))) }
          });
          items = items.map(i => {
            (i as any).evaluation = evaluations.find(e => Number(e.supplier_order_id) === Number(i.id));
            return i;
          });
        }
      } catch (e) {
        log(`[getSupplierOrders] Warning: Could not load evaluations (table might be missing): ${e.message}`);
      }

      return {
        summary: {
          total_orders: Number(summaryStats?.total_orders || 0),
          total_qty: Number(summaryStats?.total_qty || 0),
          total_amount: Number(summaryStats?.total_amount || 0),
          avg_qty_per_day: Math.round(Number(summaryStats?.avg_qty_per_order || 0)),
        },
        items,
        total,
        limit,
        page
      };
    } catch (error) {
      log(`getSupplierOrders error: ${error.message}`);
      throw error;
    }
  }

  async findWeeklyMenu(weekStart: string) {
    log(`Entering findWeeklyMenu: weekStart=${weekStart}`);
    try {
      const start = moment(weekStart).startOf('day');
      const end = moment(start).add(6, 'days').endOf('day');
      log(`Date range: ${start.format('YYYY-MM-DD')} -> ${end.format('YYYY-MM-DD')}`);

      const menus = await this.menuRepo.find({
        where: {
          menu_date: Between(
            start.format('YYYY-MM-DD'),
            end.format('YYYY-MM-DD'),
          ) as any,
        },
        relations: ['items', 'items.dish', 'supplier'],
        order: { menu_date: 'ASC', meal_slot: 'ASC' },
      });
      log(`findWeeklyMenu success. Found ${menus.length} menus.`);

      const weekLabel = `Tuáº§n ${start.format('ww/YYYY')} (${start.format('DD/MM')} - ${end.format('DD/MM')})`;

      // Calculate stats
      let totalMeals = 0;
      let totalCost = 0;
      const suppliers = new Set();

      menus.forEach(m => {
        const slotsPlanned = (m.items?.length || 0) * 100; // Mocking 100 meals per dish for stats
        totalMeals += slotsPlanned;
        totalCost += (m.items || []).reduce((sum, item) => sum + (Number(item.unit_price_snapshot) * 100), 0);
        if (m.supplier) suppliers.add(m.supplier.id);
      });

      return {
        week_start: weekStart,
        week_label: weekLabel,
        stats: {
          total_meals_planned: totalMeals,
          estimated_cost: totalCost,
          supplier_count: suppliers.size
        },
        days: this.groupMenusByDay(menus, weekStart)
      };
    } catch (error) {
      log(`findWeeklyMenu error: ${error.message}`);
      log(error.stack);
      console.error('[MealService] Error finding weekly menu:', error);
      throw error;
    }
  }

  async findAllTemplates() {
    return this.templateRepo.find({ order: { updated_at: 'DESC' } });
  }

  async saveAsTemplate(dto: CreateTemplateDto, userId: string) {
    const template = this.templateRepo.create({
      name: dto.name,
      description: dto.description ?? null,
      // created_by: { id: userId } as any
    });
    const savedTemplate = await this.templateRepo.save(template);

    const items = dto.items.map(item => this.templateItemRepo.create({
      template_id: Number(savedTemplate.id),
      day_offset: item.day_offset,
      meal_slot: item.meal_slot,
      dish_id: Number(item.dish_id),
      sort_order: item.sort_order
    }));

    await this.templateItemRepo.save(items);
    return savedTemplate;
  }

  async applyTemplate(dto: ApplyTemplateDto) {
    this.validateMenuNotLocked(dto.week_start);
    const templateItems = await this.templateItemRepo.find({
      where: { template_id: dto.template_id },
      relations: ['dish']
    });

    if (!templateItems.length) {
      throw new BadRequestException('Báº£n máº«u khÃ´ng cÃ³ mÃ³n Äƒn nÃ o.');
    }

    const start = moment(dto.week_start).startOf('day');
    const end = moment(start).add(6, 'days').endOf('day');

    // Optimization: Fetch all existing menus for this week in one go
    const existingMenus = await this.menuRepo.find({
      where: {
        menu_date: Between(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'))
      }
    });

    // Create menu entries from template
    for (const item of templateItems) {
      const menuDate = moment(start).add(item.day_offset, 'days').format('YYYY-MM-DD');

      let menu = existingMenus.find(m => m.menu_date === menuDate && m.meal_slot === item.meal_slot);

      if (!menu) {
        menu = this.menuRepo.create({
          menu_date: menuDate,
          meal_slot: item.meal_slot,
          register_deadline_at: moment(menuDate).subtract(1, 'day').hour(16).toDate(),
          cancel_deadline_at: moment(menuDate).hour(8).toDate(),
        });
        menu = await this.menuRepo.save(menu);
        existingMenus.push(menu); // Add to local track to avoid multiple creates for same slot
      }

      const menuItem = this.menuItemRepo.create({
        menu_id: Number(menu.id),
        dish_id: Number(item.dish_id),
        unit_price_snapshot: 0,
        sort_order: item.sort_order
      });

      await this.menuItemRepo.save(menuItem);
    }

    return { success: true };
  }

  async publishMenu(weekStart: string) {
    this.validateMenuNotLocked(weekStart);
    const start = moment(weekStart).startOf('day');
    const end = moment(start).add(6, 'days').endOf('day');

    const result = await this.menuRepo.update(
      {
        menu_date: Between(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')),
      },
      {
        status: 'published',
        published_at: new Date()
      }
    );

    return { success: true, count: result.affected };
  }

  async saveWeeklyMenu(dto: CreateWeeklyMenuDto, userId: string) {
    this.validateMenuNotLocked(dto.week_start);
    const start = moment(dto.week_start).startOf('day');
    const end = moment(start).add(6, 'days').endOf('day');

    // Fetch existing menus to avoid N+1 in lookup
    const existingMenus = await this.menuRepo.find({
      where: {
        menu_date: Between(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'))
      }
    });

    for (const menuDto of dto.menus) {
      let menu = existingMenus.find(m => m.menu_date === menuDto.menu_date && m.meal_slot === menuDto.meal_slot);

      if (!menu) {
        menu = this.menuRepo.create({
          menu_date: menuDto.menu_date,
          meal_slot: menuDto.meal_slot,
        });
      }

      if (menuDto.supplier_id) {
        menu.supplier = { id: menuDto.supplier_id } as SupplierEntity;
      }
      menu.register_deadline_at = new Date(menuDto.register_deadline_at);
      menu.cancel_deadline_at = new Date(menuDto.cancel_deadline_at);
      menu.note = menuDto.note || null;
      menu.serving_time = menuDto.serving_time || null;
      menu.image_url_manual = menuDto.image_url_manual || null;
      menu.description_manual = menuDto.description_manual || null;
      menu.title_manual = menuDto.title_manual || null;
      menu.price_total_planned = Number(menuDto.price_total_planned || 0);

      const savedMenu = await this.menuRepo.save(menu);

      // Save items
      await this.menuItemRepo.delete({ menu_id: Number(savedMenu.id) });
      const items = (menuDto.items || []).map((itemDto) =>
        this.menuItemRepo.create({
          menu_id: Number(savedMenu.id),
          dish_id: Number(itemDto.dish_id),
          unit_price_snapshot: itemDto.unit_price_snapshot,
          unit: itemDto.unit,
          sort_order: itemDto.sort_order,
        }),
      );
      await this.menuItemRepo.save(items);
    }

    return { success: true };
  }

  async findDailyMenuV2(date: string) {
    log(`[MealService] findDailyMenu called for date: ${date}`);
    const menus = await this.menuRepo.find({
      where: { menu_date: Between(date, date) as any },
      relations: ['items', 'items.dish', 'supplier'],
      order: { meal_slot: 'ASC' },
    });
    log(`[MealService] findDailyMenu found ${menus.length} slots`);

    return {
      date,
      slots: menus.map(m => ({
        id: m.id,
        meal_slot: m.meal_slot,
        supplier_id: m.supplier?.id,
        status: m.status,
        register_deadline_at: m.register_deadline_at,
        cancel_deadline_at: m.cancel_deadline_at,
        note: m.note,
        serving_time: m.serving_time,
        image_url_manual: m.image_url_manual,
        description_manual: m.description_manual,
        title_manual: m.title_manual,
        price_total_planned: m.price_total_planned,
        items: m.items?.map(i => ({
          id: i.id,
          dish_id: i.dish_id,
          dish_name: i.dish?.name,
          unit: i.unit,
          unit_price_snapshot: i.unit_price_snapshot,
          sort_order: i.sort_order,
        })) || [],
      })),
    };
  }

  async saveDailyMenu(dto: DailyMenuDto, userId: string) {
    this.validateMenuNotLocked(dto.date);
    const { date, menus } = dto;

    for (const menuDto of menus) {
      let menu = await this.menuRepo.findOne({
        where: { menu_date: date, meal_slot: menuDto.meal_slot },
      });

      if (!menu) {
        menu = this.menuRepo.create({
          menu_date: date,
          meal_slot: menuDto.meal_slot,
        });
      }

      if (menuDto.supplier_id) {
        menu.supplier = { id: menuDto.supplier_id } as SupplierEntity;
      }
      menu.register_deadline_at = new Date(menuDto.register_deadline_at);
      menu.cancel_deadline_at = new Date(menuDto.cancel_deadline_at);
      menu.note = menuDto.note || null;
      menu.serving_time = menuDto.serving_time || null;
      menu.image_url_manual = menuDto.image_url_manual || null;
      menu.description_manual = menuDto.description_manual || null;
      menu.title_manual = menuDto.title_manual || null;
      menu.price_total_planned = Number(menuDto.price_total_planned || 0);

      const savedMenu = await this.menuRepo.save(menu);

      // Save items
      await this.menuItemRepo.delete({ menu_id: Number(savedMenu.id) });
      const items = (menuDto.items || []).map((itemDto) =>
        this.menuItemRepo.create({
          menu_id: Number(savedMenu.id),
          dish_id: Number(itemDto.dish_id),
          unit_price_snapshot: itemDto.unit_price_snapshot,
          unit: itemDto.unit,
          sort_order: itemDto.sort_order,
        }),
      );
      await this.menuItemRepo.save(items);
    }

    return { success: true };
  }

  async deleteMenu(id: number) {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (menu) this.validateMenuNotLocked(menu.menu_date);
    // Delete items first
    await this.menuItemRepo.delete({ menu_id: id });
    await this.menuRepo.delete(id);
    return { success: true };
  }

  async updateMenuStatus(id: number, status: string) {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) throw new BadRequestException('Thá»±c Ä‘Æ¡n khÃ´ng tá»“n táº¡i.');
    this.validateMenuNotLocked(menu.menu_date);

    menu.status = status;
    if (status === 'published') {
      menu.published_at = new Date();
    }
    await this.menuRepo.save(menu);
    return { success: true };
  }

  async copyDailyMenu(dto: CopyDailyMenuDto, userId: string) {
    this.validateMenuNotLocked(dto.to_date);
    const sourceMenus = await this.menuRepo.find({
      where: { menu_date: dto.from_date },
      relations: ['items'],
    });

    if (sourceMenus.length === 0) {
      throw new BadRequestException('KhÃ´ng tÃ¬m tháº¥y thá»±c Ä‘Æ¡n nguá»“n Ä‘á»ƒ sao chÃ©p.');
    }

    // Delete existing target menus for that day to overwrite
    const existingTarget = await this.menuRepo.find({ where: { menu_date: dto.to_date } });
    for (const m of existingTarget) {
      await this.menuItemRepo.delete({ menu_id: m.id });
      await this.menuRepo.delete(m.id);
    }

    for (const sMenu of sourceMenus) {
      const newMenu = this.menuRepo.create({
        menu_date: dto.to_date,
        meal_slot: sMenu.meal_slot,
        register_deadline_at: sMenu.register_deadline_at,
        cancel_deadline_at: sMenu.cancel_deadline_at,
        status: 'draft',
        note: sMenu.note,
        supplier: sMenu.supplier
      });
      const savedMenu = await this.menuRepo.save(newMenu);

      const newItems = sMenu.items.map(i => this.menuItemRepo.create({
        menu_id: Number(savedMenu.id),
        dish_id: i.dish_id,
        unit_price_snapshot: i.unit_price_snapshot,
        unit: i.unit,
        sort_order: i.sort_order,
      }));
      await this.menuItemRepo.save(newItems);
    }

    return { success: true, count: sourceMenus.length };
  }

  async findMyRegistrations(userId: string, month: string) {
    const start = moment(month, 'YYYY-MM').startOf('month');
    const end = moment(start).endOf('month');
    const menuItemRelation = this.resolveRegistrationMenuItemRelation();
    const userIdProp = this.registrationRepo.metadata.findColumnWithPropertyName('user_id')
      ? 'user_id'
      : 'userId';

    const relations = ['menu'];
    if (menuItemRelation) {
      relations.push(menuItemRelation, `${menuItemRelation}.dish`);
    }

    return this.registrationRepo.find({
      where: {
        [userIdProp]: userId,
        menu: {
          menu_date: Between(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')) as any
        }
      } as any,
      relations,
      order: { menu: { menu_date: 'ASC', meal_slot: 'ASC' } }
    });
  }

  private resolveRegistrationMenuItemRelation(): 'menu_item' | 'menuItem' | null {
    const relationNames = (this.registrationRepo.metadata?.relations || []).map((r) => r.propertyName);
    if (relationNames.includes('menuItem')) return 'menuItem';
    if (relationNames.includes('menu_item')) return 'menu_item';
    return null;
  }

  private normalizeDate(value?: string) {
    const fallback = moment().format('YYYY-MM-DD');
    if (!value) return fallback;
    const m = moment(value, ['YYYY-MM-DD', moment.ISO_8601], true);
    return m.isValid() ? m.format('YYYY-MM-DD') : fallback;
  }

  private normalizeDateRange(start?: string, end?: string) {
    const startDate = this.normalizeDate(start);
    const endDate = this.normalizeDate(end || startDate);
    if (moment(startDate).isAfter(endDate)) {
      return { startDate: endDate, endDate: startDate };
    }
    return { startDate, endDate };
  }

  private calculateMenuPrice(menu: MenuEntity) {
    if (!menu) return 0;
    if (Number(menu.price_total_planned || 0) > 0) return Number(menu.price_total_planned || 0);
    const firstItem = Array.isArray(menu.items) && menu.items.length > 0
      ? [...menu.items].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))[0]
      : null;
    return Number(firstItem?.unit_price_snapshot || 0);
  }

  private async getAbsenceRecordForDate(userId: string, date: string) {
    try {
      return await this.leaveRepo
        .createQueryBuilder('a')
        .where('(a.user_id = :userId OR (a.user_id IS NULL AND a.type = :holidayType))', {
          userId,
          holidayType: 'holiday',
        })
        .andWhere('a.is_approved = 1')
        .andWhere('a.date_from <= :date AND a.date_to >= :date', { date })
        .orderBy('a.user_id', 'DESC')
        .getOne();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`[MealService] getAbsenceRecordForDate fallback: ${message}`);
      return null;
    }
  }

  private async applyAutoCuts(userId: string, startDate: string, endDate: string) {
    const activeRegs = await this.registrationRepo
      .createQueryBuilder('reg')
      .leftJoinAndSelect('reg.menu', 'menu')
      .where('reg.user_id = :userId', { userId })
      .andWhere('reg.status = :status', { status: 'registered' })
      .andWhere('menu.menu_date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();

    const toUpdate: MealRegistrationEntity[] = [];
    for (const reg of activeRegs) {
      const absence = await this.getAbsenceRecordForDate(userId, reg.menu?.menu_date);
      if (!absence) continue;
      reg.status = 'auto_cut';
      reg.auto_cut_reason = absence.type;
      reg.auto_cut_at = new Date();
      reg.auto_cut_source_record_id = Number(absence.id);
      reg.cancelled_at = new Date();
      reg.cancel_reason = `Auto cut: ${absence.type}`;
      toUpdate.push(reg);
    }

    if (toUpdate.length) {
      await this.registrationRepo.save(toUpdate);
    }
  }

  private async buildUserDateRegistrations(userId: string, startDate: string, endDate: string) {
    await this.applyAutoCuts(userId, startDate, endDate);
    const menuItemRelation = this.resolveRegistrationMenuItemRelation();

    const baseQuery = this.registrationRepo
      .createQueryBuilder('reg')
      .leftJoinAndSelect('reg.menu', 'menu')
      .leftJoinAndSelect('menu.items', 'menuPriceItem')
      .where('reg.user_id = :userId', { userId })
      .andWhere('menu.menu_date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('menu.menu_date', 'DESC')
      .addOrderBy('menu.meal_slot', 'ASC');

    let regs: MealRegistrationEntity[] = [];
    const candidateRelations = menuItemRelation
      ? [menuItemRelation]
      : (['menuItem', 'menu_item'] as const);

    let loaded = false;
    for (const rel of candidateRelations) {
      try {
        const withItem = baseQuery.clone();
        withItem.leftJoinAndSelect(`reg.${rel}`, 'menuItem');
        withItem.leftJoinAndSelect('menuItem.dish', 'dish');
        regs = await withItem.getMany();
        loaded = true;
        break;
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (!msg.includes('Relation with property path')) {
          throw err;
        }
      }
    }
    if (!loaded) {
      regs = await baseQuery.getMany();
    }

    const grouped = new Map<string, any>();
    for (const reg of regs) {
      const date = reg.menu?.menu_date;
      if (!date) continue;
      if (!grouped.has(date)) {
        grouped.set(date, {
          id: Number(reg.id),
          date,
          note: null,
          registeredAt: reg.registered_at || reg.created_at,
          cancelledAt: null,
          status: 'upcoming',
          totalCost: 0,
          items: [],
          _rows: [],
        });
      }

      const bucket = grouped.get(date);
      bucket._rows.push(reg);
      const mealSessionId = this.slotSessionMap[String(reg.menu?.meal_slot || '').toLowerCase()] || 0;

      if (reg.status === 'registered') {
        const regMenuItem = (reg as any).menu_item ?? (reg as any).menuItem ?? null;
        const menuPrice = this.calculateMenuPrice(reg.menu);
        const snapshotPrice = Number(regMenuItem?.unit_price_snapshot || 0);
        const priceAtTime = snapshotPrice > 0 ? snapshotPrice : Number(menuPrice || 0);
        bucket.totalCost += priceAtTime;
        bucket.items.push({
          id: Number(reg.id),
          mealSessionId,
          mealSession: {
            name: reg.menu?.meal_slot,
            timeStart: null,
            timeEnd: null,
          },
          priceAtTime,
          dailyMenu: {
            dishName: regMenuItem?.dish?.name || null,
          },
        });
      }
    }

    for (const [date, bucket] of grouped.entries()) {
      const rows: MealRegistrationEntity[] = bucket._rows;
      const hasActive = rows.some((r) => r.status === 'registered');
      const hasCancelled = rows.some((r) => r.status === 'cancelled');
      const hasAutoCut = rows.some((r) => r.status === 'auto_cut');
      const isPast = moment(date).isBefore(moment(), 'day');

      if (hasActive) {
        bucket.status = isPast ? 'completed' : 'upcoming';
      } else if (hasAutoCut) {
        bucket.status = 'cancelled';
      } else if (hasCancelled) {
        bucket.status = 'cancelled';
      } else {
        bucket.status = isPast ? 'completed' : 'upcoming';
      }

      bucket.cancelledAt = rows.find((r) => !!r.cancelled_at)?.cancelled_at || null;
      delete bucket._rows;
      grouped.set(date, bucket);
    }

    return Array.from(grouped.values()).sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf());
  }

  async getCalendarV2(userId: string, startDate?: string, endDate?: string) {
    const range = this.normalizeDateRange(startDate, endDate);

    const menus = await this.menuRepo
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.items', 'item')
      .leftJoinAndSelect('item.dish', 'dish')
      .where('menu.menu_date BETWEEN :startDate AND :endDate', range)
      .andWhere('menu.status = :status', { status: 'published' })
      .orderBy('menu.menu_date', 'ASC')
      .addOrderBy('menu.meal_slot', 'ASC')
      .getMany();

    const menuRows = menus
      .filter((menu) => (menu.items || []).length > 0)
      .map((menu) => ({
        id: Number(menu.id),
        date: menu.menu_date,
        mealSessionId: this.slotSessionMap[String(menu.meal_slot || '').toLowerCase()] || 0,
        price: this.calculateMenuPrice(menu),
        dishName: menu.items?.[0]?.dish?.name || null,
        registerDeadlineAt: menu.register_deadline_at,
        cancelDeadlineAt: menu.cancel_deadline_at,
      }));

    const registrations = await this.buildUserDateRegistrations(userId, range.startDate, range.endDate);
    return { menus: menuRows, registrations };
  }

  async getMyRegistrationsV2(
    userId: string,
    query: { page?: number; limit?: number; status?: string; start_date?: string; end_date?: string; month?: string },
  ) {
    const page = Number(query.page || 1) > 0 ? Number(query.page || 1) : 1;
    const limit = Number(query.limit || 20) > 0 ? Number(query.limit || 20) : 20;
    const month = query.month ? moment(query.month, ['YYYY-MM', 'YYYY-MM-DD'], true) : null;

    let range = this.normalizeDateRange(query.start_date, query.end_date);
    if (month?.isValid()) {
      range = {
        startDate: month.clone().startOf('month').format('YYYY-MM-DD'),
        endDate: month.clone().endOf('month').format('YYYY-MM-DD'),
      };
    }

    const all = await this.buildUserDateRegistrations(userId, range.startDate, range.endDate);
    const filtered = query.status ? all.filter((item) => item.status === query.status) : all;

    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    return {
      items,
      meta: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      },
    };
  }

  async getMyStatsV2(userId: string, startDate?: string, endDate?: string) {
    const range = this.normalizeDateRange(startDate, endDate);
    const regs = await this.registrationRepo
      .createQueryBuilder('reg')
      .leftJoinAndSelect('reg.menu', 'menu')
      .leftJoinAndSelect('menu.items', 'menuPriceItem')
      .leftJoinAndSelect('reg.menu_item', 'menuItem')
      .where('reg.user_id = :userId', { userId })
      .andWhere('menu.menu_date BETWEEN :startDate AND :endDate', {
        startDate: range.startDate,
        endDate: range.endDate,
      })
      .getMany();

    let totalRegistered = 0;
    let cancelled = 0;
    let totalCost = 0;

    regs.forEach((reg: any) => {
      const status = String(reg?.status || '').toLowerCase();
      const isCancelled = status === 'cancelled' || status === 'auto_cut';
      if (isCancelled) {
        cancelled += 1;
        return;
      }

      totalRegistered += 1;
      const regMenuItem = (reg as any)?.menu_item ?? (reg as any)?.menuItem ?? null;
      const snapshotPrice = Number(regMenuItem?.unit_price_snapshot || 0);
      const menuPrice = this.calculateMenuPrice(reg?.menu as any);
      const resolvedPrice = snapshotPrice > 0 ? snapshotPrice : menuPrice;
      totalCost += Number.isFinite(resolvedPrice) ? resolvedPrice : 0;
    });

    const completedRows: Array<{ completed_count: number }> = await this.dataSource.query(
      `
      SELECT COUNT(DISTINCT c.id) AS completed_count
      FROM meal_checkins c
      INNER JOIN menus m ON m.id = c.menu_id
      WHERE c.user_id = @0
        AND m.menu_date >= @1
        AND m.menu_date <= @2
      `,
      [userId, range.startDate, range.endDate],
    );
    const completedRaw = Number(completedRows?.[0]?.completed_count || 0);
    const completed = Math.min(totalRegistered, Math.max(0, completedRaw));
    const upcoming = Math.max(0, totalRegistered - completed);

    return {
      total_registered: totalRegistered,
      completed,
      upcoming,
      cancelled,
      total_cost: totalCost,
    };
  }

  async registerByDateV2(userId: string, payload: { date: string; meal_session_ids: number[]; note?: string | null }) {
    log(`[registerByDateV2] user=${userId} date=${payload?.date} sessions=${JSON.stringify(payload?.meal_session_ids || [])}`);
    const date = this.normalizeDate(payload.date);
    const sessions = Array.from(new Set((payload.meal_session_ids || []).map((x) => Number(x)).filter((x) => [1, 2, 3].includes(x))));
    if (!sessions.length) throw new BadRequestException('Please select at least one meal session.');

    const absence = await this.getAbsenceRecordForDate(userId, date);
    if (absence) {
      throw new BadRequestException('This date is blocked by leave/business schedule.');
    }

    const menus = await this.menuRepo
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.items', 'item')
      .leftJoinAndSelect('item.dish', 'dish')
      .where('menu.menu_date = :date', { date })
      .andWhere('menu.status = :status', { status: 'published' })
      .getMany();

    let createdCount = 0;
    const failedSessions: Array<{ meal_session_id: number; message: string }> = [];
    let alreadyRegisteredCount = 0;
    for (const sessionId of sessions) {
      const slot = this.mealSessionMap[sessionId];
      const menu = menus.find((m) => String(m.meal_slot).toLowerCase() === slot);
      if (!menu || !menu.items?.length) continue;
      try {
        await this.registerMeal(userId, { menu_id: Number(menu.id) });
        createdCount += 1;
      } catch (error) {
        const message = String((error as any)?.response?.message || (error as any)?.message || 'Could not register this session.');
        if (message === 'You have already registered this meal.') {
          alreadyRegisteredCount += 1;
        }
        failedSessions.push({ meal_session_id: Number(sessionId), message: String(message) });
      }
    }

    if (createdCount === 0) {
      if (alreadyRegisteredCount > 0 && alreadyRegisteredCount === failedSessions.length) {
        return {
          success: true,
          registered: 0,
          already_registered: true,
          message: 'You already registered the selected meal sessions.',
          failed_sessions: failedSessions,
        };
      }
      const firstReason = failedSessions[0]?.message || 'No valid published menu found for selected sessions.';
      log(`[registerByDateV2] failed user=${userId} date=${date} reason=${firstReason}`);
      throw new BadRequestException(firstReason);
    }

    return { success: true, registered: createdCount, failed_sessions: failedSessions };
  }

  async updateRegistrationV2(
    userId: string,
    regId: number,
    payload: { meal_session_ids?: number[]; note?: string | null },
  ) {
    const reg = await this.registrationRepo.findOne({
      where: { id: regId, user_id: userId },
      relations: ['menu'],
    });
    if (!reg || !reg.menu?.menu_date) {
      throw new BadRequestException('KhÃ´ng tÃ¬m tháº¥y Ä‘Äƒng kÃ½ Ä‘á»ƒ cáº­p nháº­t.');
    }

    const date = reg.menu.menu_date;
    const sessions = Array.from(new Set((payload.meal_session_ids || []).map((x) => Number(x)).filter((x) => [1, 2, 3].includes(x))));

    const dayRegs = await this.registrationRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.menu', 'menu')
      .where('r.user_id = :userId', { userId })
      .andWhere('menu.menu_date = :date', { date })
      .getMany();

    const menus = await this.menuRepo.find({ where: { menu_date: date, status: 'published' as any } });
    const sessionToMenu = new Map<number, MenuEntity>();
    menus.forEach((m) => {
      const sid = this.slotSessionMap[String(m.meal_slot || '').toLowerCase()];
      if (sid) sessionToMenu.set(sid, m);
    });

    for (const [sid, menu] of sessionToMenu.entries()) {
      if (moment().isAfter(menu.register_deadline_at)) {
        throw new BadRequestException(`ÄÃ£ quÃ¡ háº¡n chá»‰nh sá»­a cho bá»¯a ${sid}.`);
      }
    }

    const byMenuId = new Map<number, MealRegistrationEntity>();
    dayRegs.forEach((r) => byMenuId.set(Number(r.menu_id), r));

    for (const [sid, menu] of sessionToMenu.entries()) {
      const existing = byMenuId.get(Number(menu.id));
      const selected = sessions.includes(sid);

      if (selected) {
        if (existing) {
          existing.status = 'registered';
          existing.cancelled_at = null;
          existing.cancel_reason = null;
          existing.auto_cut_at = null;
          existing.auto_cut_reason = null;
          await this.registrationRepo.save(existing);
        } else {
          await this.registrationRepo.save(
            this.registrationRepo.create({
              user_id: userId,
              menu_id: Number(menu.id),
              status: 'registered',
              registered_at: new Date(),
              cancel_reason: payload.note || null,
            }),
          );
        }
      } else if (existing && existing.status === 'registered') {
        existing.status = 'cancelled';
        existing.cancel_reason = payload.note || 'Updated by user';
        existing.cancelled_at = new Date();
        await this.registrationRepo.save(existing);
      }
    }

    return { success: true };
  }

  async quickRegisterWeekV2(userId: string, payload: { week_start_date: string; template_id?: number }) {
    const start = moment(this.normalizeDate(payload.week_start_date)).startOf('isoWeek');
    const end = start.clone().endOf('isoWeek');
    return this.quickRegisterRangeV2(userId, start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'));
  }

  async quickRegisterMonthV2(userId: string, payload: { month: string; template_id?: number }) {
    const m = moment(payload.month, ['YYYY-MM', 'YYYY-MM-DD'], true);
    const start = (m.isValid() ? m : moment()).startOf('month');
    const end = start.clone().endOf('month');
    return this.quickRegisterRangeV2(userId, start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'));
  }

  async bulkRegisterByFiltersV2(
    userId: string,
    payload: {
      start_date: string;
      end_date: string;
      days_of_week?: number[];
      meal_session_ids?: number[];
      template_id?: number;
    },
  ) {
    const startDate = this.normalizeDate(payload.start_date);
    const endDate = this.normalizeDate(payload.end_date);
    const range = this.normalizeDateRange(startDate, endDate);

    let sessionIds = Array.from(
      new Set(((payload.meal_session_ids || []) as number[]).map((x) => Number(x)).filter((x) => [1, 2, 3].includes(x))),
    );

    if ((!sessionIds.length) && payload.template_id) {
      const template = await this.mealTemplateRepo.findOne({ where: { id: Number(payload.template_id) } });
      if (template?.mealSessions) {
        try {
          const fromTemplate = JSON.parse(template.mealSessions);
          sessionIds = Array.from(new Set((fromTemplate || []).map((x) => Number(x)).filter((x) => [1, 2, 3].includes(x))));
        } catch {
          sessionIds = [];
        }
      }
    }

    if (!sessionIds.length) {
      throw new BadRequestException('Vui lÃ²ng chá»n Ã­t nháº¥t má»™t bá»¯a Äƒn.');
    }

    const allowedDays = new Set(
      ((payload.days_of_week || [1, 2, 3, 4, 5]) as number[])
        .map((d) => Number(d))
        .filter((d) => d >= 0 && d <= 6),
    );

    const slots = sessionIds
      .map((id) => this.mealSessionMap[id])
      .filter((x): x is string => Boolean(x));

    await this.applyAutoCuts(userId, range.startDate, range.endDate);
    const menus = await this.menuRepo.find({
      where: {
        menu_date: Between(range.startDate, range.endDate) as any,
        meal_slot: In(slots as any),
        status: 'published' as any,
      },
    });

    let successCount = 0;
    let skippedCount = 0;
    const skippedDates = new Set<string>();
    for (const menu of menus) {
      const day = moment(menu.menu_date).day(); // 0=Sun..6=Sat
      if (!allowedDays.has(day)) {
        skippedCount += 1;
        skippedDates.add(menu.menu_date);
        continue;
      }
      try {
        await this.registerMeal(userId, { menu_id: Number(menu.id) });
        successCount += 1;
      } catch {
        skippedCount += 1;
        skippedDates.add(menu.menu_date);
      }
    }

    return {
      success: true,
      registered: successCount,
      skipped: skippedCount,
      skipped_dates: Array.from(skippedDates),
      totalMenus: menus.length,
    };
  }

  private async quickRegisterRangeV2(userId: string, startDate: string, endDate: string) {
    await this.applyAutoCuts(userId, startDate, endDate);
    const menus = await this.menuRepo.find({
      where: {
        menu_date: Between(startDate, endDate) as any,
        status: 'published' as any,
      },
    });

    let successCount = 0;
    for (const menu of menus) {
      try {
        await this.registerMeal(userId, { menu_id: Number(menu.id) });
        successCount += 1;
      } catch (e) {
        // skip invalid menu/deadline/already registered
      }
    }

    return { success: true, registered: successCount, totalMenus: menus.length };
  }

  private async hasActiveMenuItems(menuId: number): Promise<boolean> {
    if (!Number.isFinite(Number(menuId)) || Number(menuId) <= 0) return false;
    const count = await this.menuItemRepo
      .createQueryBuilder('mi')
      .where('mi.menu_id = :menuId', { menuId: Number(menuId) })
      .andWhere('mi.deleted_at IS NULL')
      .getCount();
    return count > 0;
  }

  async registerMeal(userId: string, dto: { menu_id: number; menu_item_id?: number | null }) {
    const menu = await this.menuRepo.findOne({ where: { id: dto.menu_id, status: 'published' as any } });
    if (!menu) throw new BadRequestException('Menu does not exist or is not published.');

    const hasItems = await this.hasActiveMenuItems(Number(menu.id));
    if (!hasItems) {
      throw new BadRequestException('Menu is not configured yet.');
    }

    let fallbackMenuItemId: number | null =
      dto.menu_item_id != null && Number.isFinite(Number(dto.menu_item_id))
        ? Number(dto.menu_item_id)
        : null;
    if (!fallbackMenuItemId) {
      const firstMenuItem = await this.menuItemRepo
        .createQueryBuilder('mi')
        .where('mi.menu_id = :menuId', { menuId: Number(dto.menu_id) })
        .andWhere('mi.deleted_at IS NULL')
        .orderBy('mi.sort_order', 'ASC')
        .addOrderBy('mi.id', 'ASC')
        .getOne();
      fallbackMenuItemId = firstMenuItem ? Number(firstMenuItem.id) : null;
    }

    // BR-02: Check registration deadline
    if (moment().isAfter(menu.register_deadline_at)) {
      throw new BadRequestException('Registration deadline has passed for this meal.');
    }

    // Check existing
    const existing = await this.registrationRepo.findOne({
      where: { user_id: userId, menu_id: dto.menu_id }
    });

    if (existing) {
      if (existing.status === 'registered') {
        throw new BadRequestException('You have already registered this meal.');
      }
      // Re-register if it was cancelled
      existing.status = 'registered';
      existing.menu_item_id = fallbackMenuItemId;
      existing.registered_at = new Date();
      existing.cancelled_at = null;
      existing.cancel_reason = null;
      return this.registrationRepo.save(existing);
    }

    const reg = this.registrationRepo.create({
      user_id: userId,
      menu_id: dto.menu_id,
      menu_item_id: fallbackMenuItemId,
      status: 'registered',
      registered_at: new Date()
    });

    return this.registrationRepo.save(reg);
  }

  async cancelRegistration(userId: string, regId: number, reason?: string | null) {
    const reg = await this.registrationRepo.findOne({
      where: { id: regId, user_id: userId },
      relations: ['menu']
    });

    if (!reg) throw new BadRequestException('ThÃ´ng tin Ä‘Äƒng kÃ½ khÃ´ng tá»“n táº¡i.');

    // BR-03: Check cancellation deadline
    if (moment().isAfter(reg.menu.cancel_deadline_at)) {
      throw new BadRequestException('ÄÃ£ quÃ¡ háº¡n há»§y Ä‘Äƒng kÃ½ cho bá»¯a Äƒn nÃ y.');
    }

    reg.status = 'cancelled';
    reg.cancelled_at = new Date();
    reg.cancel_reason = reason ?? null;

    return this.registrationRepo.save(reg);
  }

  async bulkRegister(userId: string, dto: { start_date: string; end_date: string; slots: string[] }) {
    const start = moment(dto.start_date).startOf('day');
    const end = moment(dto.end_date).endOf('day');

    const menus = await this.menuRepo.find({
      where: {
        menu_date: Between(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')) as any,
        meal_slot: In(dto.slots),
        status: 'published'
      }
    });

    const results: MealRegistrationEntity[] = [];
    for (const menu of menus) {
      try {
        const res = await this.registerMeal(userId, { menu_id: Number(menu.id) });
        results.push(res);
      } catch (e) {

        // Skip days already passed or already registered
        log(`Bulk register skip menu ${menu.id}: ${e.message}`);
      }
    }
    return results;
  }

  async findAllRegistrations(params: { date: string; dept?: string; slot?: string; q?: string }) {
    const menuItemRelation = this.resolveRegistrationMenuItemRelation();
    const query = this.registrationRepo.createQueryBuilder('reg')
      .leftJoinAndSelect('reg.menu', 'menu')
      .where('menu.menu_date = :date', { date: params.date });

    if (menuItemRelation) {
      query.leftJoinAndSelect(`reg.${menuItemRelation}`, 'menuItem');
      query.leftJoinAndSelect('menuItem.dish', 'dish');
    }

    if (params.dept) {
      // Assuming user info is available or we join with a users table if it exists in this DB
      // For now, let's assume department is stored in meal_registrations or we need a join
      // Based on be_eoffice_ptsc\tailieu\api.txt, department_code is in users table.
      // But users table is described as "Module 1" but may not be in this MSSQL connection.
      // Let's check the entities.
    }

    if (params.slot) {
      query.andWhere('menu.meal_slot = :slot', { slot: params.slot });
    }

    if (params.q) {
      query.andWhere('(reg.user_id LIKE :q OR reg.cancel_reason LIKE :q)', { q: `%${params.q}%` });
    }

    return query.getMany();
  }

  async getDailySummary(date: string) {
    const stats = await this.registrationRepo.createQueryBuilder('reg')
      .leftJoin('reg.menu', 'menu')
      .select('menu.meal_slot', 'slot')
      .addSelect('COUNT(reg.id)', 'count')
      .where('menu.menu_date = :date', { date })
      .andWhere('reg.status IN (:...statuses)', { statuses: ['registered', 'completed'] })
      .groupBy('menu.meal_slot')
      .getRawMany();

    const dishStats = await this.registrationRepo.createQueryBuilder('reg')
      .select('reg.menu_item_id', 'menuItemId')
      .addSelect('COUNT(reg.id)', 'count')
      .innerJoin('reg.menu', 'menu')
      .where('menu.menu_date = :date', { date })
      .andWhere('reg.status IN (:...statuses)', { statuses: ['registered', 'completed'] })
      .andWhere('reg.menu_item_id IS NOT NULL')
      .groupBy('reg.menu_item_id')
      .getRawMany();

    const dishRegistrations: Record<number, number> = {};
    dishStats.forEach(ds => {
      if (ds.menuItemId) dishRegistrations[Number(ds.menuItemId)] = parseInt(ds.count);
    });

    const summary = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      total: 0
    };

    stats.forEach(s => {
      if (s.slot === 'breakfast') summary.breakfast = parseInt(s.count);
      if (s.slot === 'lunch') summary.lunch = parseInt(s.count);
      if (s.slot === 'dinner') summary.dinner = parseInt(s.count);
    });

    summary.total = summary.breakfast + summary.lunch + summary.dinner;
    return {
      ...summary,
      dish_registrations: dishRegistrations
    };
  }

  async getDepartmentRegistrationSummary(date: string) {
    const query = this.registrationRepo.createQueryBuilder('reg')
      .innerJoin('reg.menu', 'menu')
      .leftJoin('reg.user', 'user')
      .select("COALESCE(NULLIF(user.organization_name, ''), N'KhÃ¡c')", 'name')
      .addSelect('COUNT(reg.id)', 'count')
      .where('menu.menu_date = :date', { date })
      .andWhere('reg.status IN (:...statuses)', { statuses: ['registered', 'completed'] })
      .groupBy("COALESCE(NULLIF(user.organization_name, ''), N'KhÃ¡c')")
      .orderBy('count', 'DESC');

    const result = await query.getRawMany();
    return result.map(r => ({
      name: r.name,
      count: parseInt(r.count)
    }));
  }

  async findAllDepartments() {
    // This might need a join with a users table. 
    // If users table is not in this connection, we might return a static list or find unique depts in registrations
    return this.registrationRepo.createQueryBuilder('reg')
      .select('DISTINCT(reg.user_id)', 'id') // This is just a placeholder logic
      .getRawMany();
  }

  private groupMenusByDay(menus: MenuEntity[], weekStart: string) {

    const days: any[] = [];
    const start = moment(weekStart).startOf('day');
    const dayNames = ['Chá»§ Nháº­t', 'Thá»© Hai', 'Thá»© Ba', 'Thá»© TÆ°', 'Thá»© NÄƒm', 'Thá»© SÃ¡u', 'Thá»© Báº£y'];
    const defaultSlots = ['breakfast', 'lunch', 'dinner'];

    for (let i = 0; i < 7; i++) {
      const current = moment(start).add(i, 'days');
      const dateStr = current.format('YYYY-MM-DD');
      const dayMenus = menus.filter(m => {
        const mDate = typeof m.menu_date === 'string' ? m.menu_date : moment(m.menu_date).format('YYYY-MM-DD');
        return mDate === dateStr;
      });

      const slots = defaultSlots.map(type => {
        const existing = dayMenus.find(m => m.meal_slot === type);
        if (existing) {
          return {
            id: existing.id,
            meal_slot: existing.meal_slot,
            supplier_id: existing.supplier?.id || (existing as any).supplier_id,
            register_deadline_at: existing.register_deadline_at,
            cancel_deadline_at: existing.cancel_deadline_at,
            status: existing.status || 'draft',
            note: existing.note,
            serving_time: existing.serving_time,
            image_url_manual: existing.image_url_manual,
            description_manual: existing.description_manual,
            title_manual: existing.title_manual,
            items: existing.items?.map(i => ({
              id: i.id,
              dish_id: i.dish_id,
              dish_name: i.dish?.name || 'MÃ³n Äƒn khÃ´ng tÃªn',
              dish_code: i.dish?.dish_code || 'N/A',
              image_url: i.dish?.image_url,
              unit: i.unit || 'suáº¥t',
              unit_price_snapshot: i.unit_price_snapshot,
              sort_order: i.sort_order
            })) || []
          };
        }
        // Return empty slot object (virtual slot)
        return {
          meal_slot: type,
          items: [],
          register_deadline_at: moment(current).subtract(1, 'day').hour(16).toDate(),
          cancel_deadline_at: moment(current).hour(8).toDate(),
          status: 'draft'
        };
      });

      days.push({
        date: dateStr,
        day_label: dayNames[current.day()],
        slots: slots
      });
    }
    return days;
  }

  // System Settings Logic
  async getSettings() {
    const settings = await this.systemSettingRepo.find();
    // Group by group
    const grouped = {};
    settings.forEach(s => {
      if (!grouped[s.group]) grouped[s.group] = {};

      let val: any = s.value;
      if (s.value_type === 'boolean') val = s.value === 'true';
      if (s.value_type === 'integer') val = parseInt(s.value);
      if (s.value_type === 'decimal') val = parseFloat(s.value);
      if (s.value_type === 'json') {
        try { val = JSON.parse(s.value); } catch { val = null; }
      }

      grouped[s.group][s.key] = {
        id: s.id,
        value: val,
        value_type: s.value_type,
        label: s.label,
        description: s.description
      };
    });
    return grouped;
  }

  async updateSettings(
    settings: Array<{
      id?: number;
      value: any;
      group?: string;
      key?: string;
      value_type?: string;
      label?: string;
      description?: string;
    }>,
  ) {
    for (const s of settings) {
      const settingId = Number(s?.id || 0);
      const value = typeof s?.value === 'object' ? JSON.stringify(s.value) : String(s?.value ?? '');

      if (Number.isFinite(settingId) && settingId > 0) {
        const entity = await this.systemSettingRepo.findOne({ where: { id: settingId } });
        if (entity) {
          entity.value = value;
          await this.systemSettingRepo.save(entity);
        }
        continue;
      }

      const group = String(s?.group || '').trim();
      const key = String(s?.key || '').trim();
      if (!group || !key) {
        continue;
      }

      let entity = await this.systemSettingRepo.findOne({ where: { group, key } });
      if (!entity) {
        entity = this.systemSettingRepo.create({
          group,
          key,
          value,
          value_type: (String(s?.value_type || '').trim() as any) || 'string',
          label: String(s?.label || key),
          description: String(s?.description || ''),
          is_public: 0,
        });
      } else {
        entity.value = value;
      }
      await this.systemSettingRepo.save(entity);
    }

    return { success: true };
  }

  @Cron('0 * * * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  private async dispatchInternalInboxNotifications() {
    try {
      const enabled = await this.getBooleanSettingValue('notification', 'reminder_enabled', false);
      if (!enabled) return;

      const now = moment().utcOffset(7 * 60);
      const today = now.format('YYYY-MM-DD');

      const reminderTime = await this.getStringSettingValue('notification', 'reminder_time', '');
      if (this.isCurrentMinuteMatched(reminderTime, now)) {
        await this.trySendMealAnnouncementOncePerDay({
          category: 'canteen_registration_reminder',
          title: 'Nháº¯c nhá»Ÿ Ä‘Äƒng kÃ½ suáº¥t Äƒn',
          content:
            'Há»‡ thá»‘ng canteen nháº¯c báº¡n Ä‘Äƒng kÃ½ suáº¥t Äƒn Ä‘Ãºng háº¡n. Vui lÃ²ng vÃ o má»¥c ÄÄƒng kÃ½ suáº¥t Äƒn Ä‘á»ƒ cáº­p nháº­t.',
          sentDate: today,
          runtimeKey: 'reminder_last_sent_date',
        });
      }

      const menuNotifyTime = await this.getStringSettingValue('notification', 'daily_menu_notify_time', '');
      if (this.isCurrentMinuteMatched(menuNotifyTime, now)) {
        const displayDate = now.format('DD/MM/YYYY');
        await this.trySendMealAnnouncementOncePerDay({
          category: 'canteen_daily_menu_notice',
          title: `ThÃ´ng bÃ¡o thá»±c Ä‘Æ¡n ngÃ y ${displayDate}`,
          content:
            'Thá»±c Ä‘Æ¡n suáº¥t Äƒn Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t. Vui lÃ²ng vÃ o má»¥c Ä Äƒng kÃ½ suáº¥t Äƒn Ä‘á»ƒ xem chi tiáº¿t vÃ  Ä‘Äƒng kÃ½.',
          sentDate: today,
          runtimeKey: 'daily_menu_last_sent_date',
        });
      }
    } catch (error) {
      log(`[MealService] dispatchInternalInboxNotifications error: ${(error as any)?.message || error}`);
    }
  }

  private async trySendMealAnnouncementOncePerDay(params: {
    category: string;
    title: string;
    content: string;
    sentDate: string;
    runtimeKey: string;
  }) {
    const { category, title, content, sentDate, runtimeKey } = params;

    const lastSentDate = await this.getStringSettingValue('notification_runtime', runtimeKey, '');
    if (lastSentDate === sentDate) return;

    log(`[Canteen Notification] ${category} - ${title}: ${content}`);
    await this.upsertSettingValue('notification_runtime', runtimeKey, sentDate, 'string');
  }

  private parseConfiguredTime(value: string): { hour: number; minute: number } | null {
    const text = String(value || '').trim();
    if (!text) return null;

    const match = text.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
    if (!match) return null;

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const suffix = (match[3] || '').toUpperCase();

    if (!Number.isFinite(hour) || !Number.isFinite(minute) || minute < 0 || minute > 59) {
      return null;
    }

    if (suffix) {
      if (hour < 1 || hour > 12) return null;
      if (suffix === 'AM') hour = hour % 12;
      if (suffix === 'PM') hour = (hour % 12) + 12;
    } else if (hour < 0 || hour > 23) {
      return null;
    }

    return { hour, minute };
  }

  private isCurrentMinuteMatched(rawTime: string, now: moment.Moment): boolean {
    const parsed = this.parseConfiguredTime(rawTime);
    if (!parsed) return false;
    return parsed.hour === now.hour() && parsed.minute === now.minute();
  }

  private async getSettingEntity(group: string, key: string) {
    return this.systemSettingRepo.findOne({ where: { group, key } });
  }

  private async getStringSettingValue(group: string, key: string, fallback: string) {
    const setting = await this.getSettingEntity(group, key);
    if (!setting || setting.value === null || setting.value === undefined) return fallback;
    return String(setting.value);
  }

  private async getBooleanSettingValue(group: string, key: string, fallback: boolean) {
    const raw = await this.getStringSettingValue(group, key, fallback ? 'true' : 'false');
    const normalized = raw.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
    return fallback;
  }

  private async upsertSettingValue(
    group: string,
    key: string,
    value: string,
    valueType: 'string' | 'integer' | 'decimal' | 'boolean' | 'time' | 'json' = 'string',
  ) {
    const existing = await this.getSettingEntity(group, key);
    if (existing) {
      existing.value = value;
      existing.value_type = valueType;
      await this.systemSettingRepo.save(existing);
      return existing;
    }

    const created = this.systemSettingRepo.create({
      group,
      key,
      value,
      value_type: valueType,
      label: key,
      description: null,
      is_public: 0,
    } as any);

    return this.systemSettingRepo.save(created);
  }

  // --- Module 2: Check-in & Reconciliation ---

  async checkIn(dto: CheckInDto, adminId?: string) {
    // 1. Validate registration
    const registration = await this.registrationRepo.findOne({
      where: { user_id: dto.user_id, menu_id: Number(dto.menu_id), status: 'registered' },
    });

    // 2. Create check-in record
    const checkin = this.checkinRepo.create({
      ...dto,
      menu_id: Number(dto.menu_id),
      menu_item_id: dto.menu_item_id ? Number(dto.menu_item_id) : null,
      registration_id: registration?.id || null,
      checked_in_at: new Date(),
      checked_in_by: adminId || null,
      is_valid: registration ? 1 : 0,
      note: dto.note || null,
    } as any);

    const saved = (await this.checkinRepo.save(checkin)) as any;
    await this.trackAction(adminId || dto.user_id, 'checkin', 'meal_checkins', Number(saved.id), null, saved);

    return saved;
  }

  async recordActualServing(dto: ActualServingDto, adminId: string) {
    const record = this.actualServingRepo.create({
      ...dto,
      menu_id: Number(dto.menu_id),
      menu_item_id: dto.menu_item_id ? Number(dto.menu_item_id) : null,
      recorded_at: new Date(),
      recorded_by: adminId,
      note: dto.note || null,
    } as any);
    const saved = (await this.actualServingRepo.save(record)) as any;
    await this.trackAction(adminId, 'create', 'meal_actual_servings', Number(saved.id), null, saved);
    return saved;
  }

  async getReconciliationReport(startDate: string, endDate: string) {
    // Basic aggregation for demonstration
    const registrations = await this.registrationRepo.count({
      where: { status: 'registered', menu: { menu_date: Between(startDate, endDate) } },
    });
    const checkins = await this.checkinRepo.count({
      where: { checked_in_at: Between(new Date(startDate), new Date(endDate)) },
    });
    const actual = await this.actualServingRepo.sum('actual_qty', {
      recorded_at: Between(new Date(startDate), new Date(endDate)),
    });

    return {
      planned_registrations: registrations,
      actual_checkins: checkins,
      reported_servings: actual || 0,
      diff_reg_vs_checkin: registrations - checkins,
      diff_checkin_vs_actual: checkins - (actual || 0),
    };
  }

  // --- Audit Logging Helper ---
  async trackAction(userId: string, action: string, table: string, id: number, oldVal?: any, newVal?: any) {
    try {
      const entry = this.auditLogRepo.create({
        user_id: userId,
        action,
        target_table: table,
        target_id: id,
        old_value: typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal || ''),
        new_value: typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal || ''),
      });
      return await this.auditLogRepo.save(entry);
    } catch (e) {
      log(`[trackAction] Error: ${e.message}`);
      return null;
    }
  }

  // --- Module 3: Supplier Management ---

  async manageSupplierContract(dto: SupplierContractDto, adminId: string) {
    const contract = this.contractRepo.create({
      ...dto,
      supplier_id: Number(dto.supplier_id),
    } as any);
    const saved = (await this.contractRepo.save(contract)) as any;

    // Update supplier cache if active
    if (dto.status === 'active') {
      await this.supplierRepo.update(Number(dto.supplier_id), {
        contract_status_cached: 'active',
        contract_end_at_cached: new Date(dto.end_date),
      });
    }

    await this.trackAction(adminId, 'create', 'supplier_contracts', Number(saved.id), null, saved);
    return saved;
  }


  async createSupplierOrder(dto: SupplierOrderDto, adminId: string) {
    const count = await this.orderRepo.count();
    const orderNo = `DH-${moment().format('YYYYMMDD')}-${(count + 1).toString().padStart(3, '0')}`;

    const order = this.orderRepo.create({
      ...dto,
      supplier_id: Number(dto.supplier_id),
      menu_id: dto.menu_id ? Number(dto.menu_id) : null,
      order_no: orderNo,
      total_amount: dto.expected_qty * dto.unit_price,
    } as any);

    const saved = (await this.orderRepo.save(order)) as any;
    await this.trackAction(adminId, 'create', 'supplier_orders', Number(saved.id), null, saved);
    return saved;
  }

  async submitEvaluation(dto: SupplierEvaluationDto, adminId: string) {
    try {
      let evaluation: SupplierEvaluationEntity;

      const baseData: any = {
        period_type: dto.period_type || 'delivery',
        period_start_date: dto.period_start_date,
        period_end_date: dto.period_end_date,
        evaluation_status: dto.evaluation_status || 'submitted',
        comment: dto.comment,
      };

      // Only assign these if they are provided (not null/undefined)
      if (dto.supplier_id) baseData.supplier_id = Number(dto.supplier_id);
      if (dto.supplier_order_id) baseData.supplier_order_id = Number(dto.supplier_order_id);
      if (dto.dish_id) baseData.dish_id = Number(dto.dish_id);

      if (dto.id) {
        const found = await this.evaluationRepo.findOne({ where: { id: Number(dto.id) } });
        if (!found) throw new BadRequestException('ÄÃ¡nh giÃ¡ khÃ´ng tá»“n táº¡i.');
        // Allow editing even if submitted
        // if (found.evaluation_status === 'submitted') throw new BadRequestException('KhÃ´ng thá»ƒ chá»‰nh sá»­a Ä‘Ã¡nh giÃ¡ Ä‘Ã£ ná»™p.');
        evaluation = found;

        Object.assign(evaluation, baseData);
        await this.evaluationScoreRepo.delete({ evaluation_id: Number(evaluation.id) });
      } else {
        if (!dto.supplier_id) throw new BadRequestException('supplier_id is required for new evaluations');

        // Safety check: One dish can only be evaluated once
        if (dto.dish_id) {
          const existing = await this.evaluationRepo.findOne({
            where: {
              dish_id: Number(dto.dish_id),
              evaluation_status: 'submitted'
            }
          });
          if (existing) {
            throw new BadRequestException('MÃ³n Äƒn nÃ y Ä‘Ã£ Ä‘Æ°á»£c Ä‘Ã¡nh giÃ¡ trÆ°á»›c Ä‘Ã³.');
          }
        }

        evaluation = new SupplierEvaluationEntity();
        Object.assign(evaluation, baseData);
      }

      const savedEval = await this.evaluationRepo.save(evaluation);

      let totalScore = 0;
      for (const s of (dto.scores || [])) {
        const score = new SupplierEvaluationScoreEntity();
        Object.assign(score, {
          criterion_code: s.criterion_code,
          score: s.score,
          comment: s.comment,
          evaluation_id: Number(savedEval.id),
        });
        await this.evaluationScoreRepo.save(score);
        totalScore += s.score;
      }

      const scoreArray = dto.scores || [];
      const avgScore = scoreArray.length > 0 ? totalScore / scoreArray.length : 0;
      savedEval.overall_score = avgScore;
      savedEval.overall_rating = avgScore >= 4.5 ? 'Xuáº¥t sáº¯c' : avgScore >= 3.5 ? 'Tá»‘t' : avgScore >= 2.5 ? 'Trung bÃ¬nh' : 'KÃ©m';
      await this.evaluationRepo.save(savedEval);

      if (savedEval.evaluation_status === 'submitted') {
        const stats = await this.evaluationRepo
          .createQueryBuilder('e')
          .where('e.supplier_id = :sid AND e.evaluation_status = :status', { sid: savedEval.supplier_id, status: 'submitted' })
          .select('AVG(e.overall_score)', 'avg')
          .addSelect('COUNT(e.id)', 'count')
          .getRawOne();

        await this.supplierRepo.update(Number(savedEval.supplier_id), {
          rating_avg_cached: stats?.avg || avgScore,
          rating_count_cached: stats?.count || 1,
        });
      }

      await this.trackAction(adminId, dto.id ? 'update_evaluation' : 'submit_evaluation', 'supplier_evaluations', Number(savedEval.id), null, savedEval);

      return await this.evaluationRepo.findOne({
        where: { id: Number(savedEval.id) },
        relations: ['scores', 'supplier', 'order', 'dish'],
      });
    } catch (error) {
      log(`[submitEvaluation] Error: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Lá»—i khi gá»­i Ä‘Ã¡nh giÃ¡: ${error.message}`);
    }
  }

  async findAllEvaluations(params: { supplier_id?: string; status?: string; from_date?: string; to_date?: string; page?: string; limit?: string; size?: string; sort?: string }) {
    try {
      const parsedSupplierId = Number(params.supplier_id);
      const hasSupplierFilter = !!params.supplier_id && Number.isFinite(parsedSupplierId) && parsedSupplierId > 0;
      if (params.supplier_id && !hasSupplierFilter) {
        log(`[findAllEvaluations] Ignore invalid supplier_id: ${params.supplier_id}`);
      }

      // 1. Fetch Evaluations (Evaluated)
      const evalQb = this.evaluationRepo.createQueryBuilder('e')
        .leftJoinAndSelect('e.supplier', 's')
        .leftJoinAndSelect('e.order', 'o')
        .leftJoinAndSelect('e.scores', 'sc')
        .leftJoinAndSelect('e.dish', 'd')
        .orderBy('e.created_at', 'DESC');

      if (hasSupplierFilter) evalQb.andWhere('e.supplier_id = :sid', { sid: parsedSupplierId });
      if (params.status && params.status !== 'pending' && params.status !== 'all') {
        evalQb.andWhere('e.evaluation_status = :status', { status: params.status });
      }
      if (params.from_date && params.to_date) {
        evalQb.andWhere('e.created_at BETWEEN :start AND :end', { start: params.from_date, end: `${params.to_date} 23:59:59` });
      }

      // EXCLUDE DRAFTS from the list as requested
      evalQb.andWhere("e.evaluation_status != 'draft'");

      let evaluations: SupplierEvaluationEntity[] = [];
      if (!params.status || params.status === 'all' || ['submitted', 'reviewed'].includes(params.status)) {
        evaluations = await evalQb.getMany();
      }

      // 2. Fetch Active Dishes without ANY SUBMITTED Evaluations (Pending)
      // A dish is pending if it does NOT have a 'submitted' evaluation.
      // Drafts are treated as pending so users can see them and complete them.
      const pendingStatus = ['submitted', 'reviewed'];
      const pendingQb = this.dishRepo.createQueryBuilder('d')
        .innerJoin('suppliers', 's', 's.id = d.supplier_id AND s.deleted_at IS NULL')
        .leftJoin('supplier_evaluations', 'e', 'e.dish_id = d.id AND e.deleted_at IS NULL AND e.evaluation_status IN (:...ss)', { ss: pendingStatus })
        .where('d.deleted_at IS NULL')
        .andWhere('e.id IS NULL');

      if (hasSupplierFilter) pendingQb.andWhere('d.supplier_id = :sid', { sid: parsedSupplierId });

      let pendingItems: any[] = [];
      if (!params.status || params.status === 'all' || params.status === 'pending') {
        const dishList = await pendingQb
          .select([
            'd.id AS dish_id',
            'd.name AS dish_name',
            's.id AS supplier_id',
            's.name AS supplier_name',
            's.supplier_code AS supplier_code',
            'd.created_at AS created_at'
          ])
          .getRawMany();
        pendingItems = dishList;
      }

      // 3. Merge and Map
      const unifiedList = [
        ...evaluations.map(e => ({
          ...e,
          is_evaluated: true,
          display_date: e.order?.order_date || moment(e.created_at).format('YYYY-MM-DD'),
          type: 'evaluated',
          evaluated_dish_ids: e.dish_id ? [Number(e.dish_id)] : []
        })),
        ...pendingItems.map(item => ({
          id: `pending_${item.dish_id}`,
          is_evaluated: false,
          supplier_id: item.supplier_id,
          supplier_order_id: null,
          dish_id: item.dish_id,
          evaluation_status: 'pending',
          overall_score: 0,
          overall_rating: 'Chá» Ä‘Ã¡nh giÃ¡',
          comment: null,
          created_at: item.created_at,
          display_date: moment(item.created_at).format('YYYY-MM-DD'),
          supplier: { name: item.supplier_name, supplier_code: item.supplier_code },
          dish: { id: item.dish_id, name: item.dish_name },
          order: null,
          scores: [],
          type: 'pending',
          evaluated_dish_ids: []
        }))
      ];

      const pageParam = Number(params.page);
      const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
      const limit = Number(params.limit || params.size || 10);
      const startIdx = (page - 1) * limit;

      // Default sort
      let sortField = 'created_at';
      let sortOrder = 'DESC';

      if (params.sort) {
        const [field, order] = params.sort.split(',');
        if (field) sortField = field;
        if (order) sortOrder = order.toUpperCase();
      }

      const sortedList = unifiedList.sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortField === 'display_date') {
          valA = a.display_date;
          valB = b.display_date;
        } else if (sortField === 'overall_score') {
          valA = a.overall_score || 0;
          valB = b.overall_score || 0;
        } else {
          // Default to created_at
          valA = new Date(a.created_at || 0).getTime();
          valB = new Date(b.created_at || 0).getTime();
        }

        if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
        if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;

        // Tie-breaker by ID (descending)
        const idA = String(a.id);
        const idB = String(b.id);
        return idB.localeCompare(idA);
      });

      return {
        data: sortedList.slice(startIdx, startIdx + limit),
        total: sortedList.length,
        page,
        limit
      };
    } catch (error) {
      log(`[findAllEvaluations] Error: ${error.message}`);
      return {
        data: [],
        total: 0,
        page: Number(params.page || 1),
        limit: Number(params.limit || 10),
      };
    }
  }

  async getSupplierEvaluationDashboardStats(): Promise<SupplierEvaluationStatsDto> {
    log('Entering getSupplierEvaluationDashboardStats (Dish-based)');
    try {
      // 1. Get Quality Stats (Counting evaluation records directly)
      // As requested, this counts all evaluations in the database, 
      // even if the supplier was deleted (to keep historical records).
      const stats = await this.evaluationRepo
        .createQueryBuilder('e')
        .select('COUNT(e.id)', 'evaluatedCount')
        .addSelect("SUM(CASE WHEN e.overall_rating = N'Xuáº¥t sáº¯c' THEN 1 ELSE 0 END)", 'excellent')
        .addSelect("SUM(CASE WHEN e.overall_rating = N'Tá»‘t' THEN 1 ELSE 0 END)", 'good')
        .addSelect("SUM(CASE WHEN e.overall_rating IN (N'Trung bÃ¬nh', N'KÃ©m') THEN 1 ELSE 0 END)", 'improvement')
        .where('e.deleted_at IS NULL')
        .andWhere('e.evaluation_status = :status', { status: 'submitted' })
        .getRawOne();

      // 2. Count Pending Dishes
      // A dish is pending if it belongs to a non-deleted supplier but has no 'submitted' evaluation.
      const pendingStatus = ['submitted', 'reviewed'];
      const pendingCount = await this.dishRepo
        .createQueryBuilder('d')
        .innerJoin('suppliers', 's', 's.id = d.supplier_id AND s.deleted_at IS NULL')
        .leftJoin('supplier_evaluations', 'e', 'e.dish_id = d.id AND e.deleted_at IS NULL AND e.evaluation_status IN (:...ss)', { ss: pendingStatus })
        .where('d.deleted_at IS NULL')
        .andWhere('e.id IS NULL')
        .getCount();

      const evaluatedTotal = Number(stats?.evaluatedCount || 0);

      const result = {
        total: evaluatedTotal, // Total = number of evaluated dishes
        pending: Number(pendingCount || 0), // Pending = number of unevaluated dishes
        excellent: Number(stats?.excellent || 0),
        good: Number(stats?.good || 0),
        improvement: Number(stats?.improvement || 0),
      };

      log(`getSupplierEvaluationDashboardStats success (Dish-based): ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      log(`getSupplierEvaluationDashboardStats error: ${error.message}`);
      throw error;
    }
  }

  async findEvaluationDetail(id: number) {
    const evaluation = await this.evaluationRepo.findOne({
      where: { id },
      relations: ['supplier', 'order', 'scores', 'dish'],
    });
    if (!evaluation) throw new BadRequestException('ÄÃ¡nh giÃ¡ khÃ´ng tá»“n táº¡i.');
    return evaluation;
  }

  async deleteEvaluation(id: number, adminId: string) {
    const evaluation = await this.evaluationRepo.findOne({ where: { id } });
    if (!evaluation) throw new BadRequestException('ÄÃ¡nh giÃ¡ khÃ´ng tá»“n táº¡i.');

    await this.evaluationRepo.softDelete(id);
    await this.trackAction(adminId, 'delete_evaluation', 'supplier_evaluations', id, evaluation, null);
    return { success: true };
  }

  async getSupplierEvaluationStats(supplierId: number) {
    try {
      // 1. Monthly trend (last 6 months)
      const trend = await this.evaluationRepo.createQueryBuilder('e')
        .select('FORMAT(e.created_at, \'yyyy-MM\')', 'month')
        .addSelect('AVG(e.overall_score)', 'avg_score')
        .addSelect('COUNT(e.id)', 'eval_count')
        .where('e.supplier_id = :sid AND e.evaluation_status = :status', { sid: supplierId, status: 'submitted' })
        .groupBy('FORMAT(e.created_at, \'yyyy-MM\')')
        .orderBy('month', 'ASC')
        .limit(6)
        .getRawMany();

      // 2. Score distribution
      const distribution = await this.evaluationRepo.createQueryBuilder('e')
        .select('CAST(ROUND(e.overall_score, 0) AS INT)', 'score_bucket')
        .addSelect('COUNT(e.id)', 'count')
        .where('e.supplier_id = :sid AND e.evaluation_status = :status', { sid: supplierId, status: 'submitted' })
        .groupBy('CAST(ROUND(e.overall_score, 0) AS INT)')
        .getRawMany();

      // 3. Criteria breakdown
      const criteria = await this.evaluationScoreRepo.createQueryBuilder('es')
        .leftJoin('es.evaluation', 'e')
        .select('es.criterion_code', 'code')
        .addSelect('AVG(es.score)', 'avg_score')
        .where('e.supplier_id = :sid AND e.evaluation_status = :status', { sid: supplierId, status: 'submitted' })
        .groupBy('es.criterion_code')
        .getRawMany();

      return {
        trend,
        distribution,
        criteria_breakdown: criteria,
      };
    } catch (error) {
      log(`[getSupplierEvaluationStats] Warning: Could not load stats (table might be missing): ${error.message}`);
      return {
        trend: [],
        distribution: [],
        criteria_breakdown: [],
      };
    }
  }
  async getWeeklyMenuV2(startDate: string) {
    log(`[MealService] getWeeklyMenuV2 called for startDate: ${startDate}`);
    try {
      const start = moment(startDate).startOf('day');
      const end = moment(start).add(6, 'days').endOf('day');

      const menus = await this.menuRepo.find({
        where: {
          menu_date: Between(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')) as any,
        },
        relations: ['items', 'items.dish', 'items.supplier', 'items.dish.supplier'],
      });

      const daysMenu = {};
      for (let i = 0; i < 7; i++) {
        const date = moment(start).add(i, 'days').format('YYYY-MM-DD');
        daysMenu[date] = {
          breakfast: [],
          lunch: [],
          dinner: [],
        };
      }

      menus.forEach((menu) => {
        const date = typeof menu.menu_date === 'string' ? menu.menu_date : moment(menu.menu_date).format('YYYY-MM-DD');
        const slot = menu.meal_slot; // 'breakfast', 'lunch', 'dinner'
        if (daysMenu[date] && daysMenu[date][slot]) {
          daysMenu[date][slot] = (menu.items || []).map((item) => ({
            id: item.dish_id,
            name: item.dish?.name || 'Món ăn không tên',
            price: Number(item.unit_price_snapshot),
            supplierName: item.supplier?.name || item.dish?.supplier?.name || 'Chưa chọn NCC',
          }));
        }
      });

      return {
        startDate,
        daysMenu,
      };
    } catch (error) {
      log(`[MealService] ERROR in getWeeklyMenuV2: ${error.message}`);
      throw error;
    }
  }

  async getDailyMenuDetail(date: string) {
    log(`[MealService] getDailyMenuDetail called for date: ${date}`);
    try {
      const menus = await this.menuRepo.find({
        where: {
          menu_date: Between(date, date) as any,
        },
        relations: ['items', 'items.dish', 'items.supplier', 'items.dish.supplier'],
      });
      log(`[MealService] Found ${menus.length} menus for date ${date}`);

      const menuObj = {
        breakfast: [],
        lunch: [],
        dinner: [],
      };

      let dayNote = '';

      for (const menu of menus) {
        const slot = menu.meal_slot; // 'breakfast', 'lunch', 'dinner'
        if (menu.note) dayNote = menu.note;

        log(`[MealService] Processing menu ID ${menu.id}, slot: ${slot}`);

        if (menuObj[slot]) {
          // Fetch actual servings for this menu
          const actualServings = await this.actualServingRepo.find({
            where: { menu_id: Number(menu.id) }
          });

          // Fetch registration counts for this menu's items
          const regStats = await this.registrationRepo.createQueryBuilder('reg')
            .select('reg.menu_item_id', 'menuItemId')
            .addSelect('COUNT(reg.id)', 'count')
            .where('reg.menu_id = :menuId', { menuId: Number(menu.id) })
            .andWhere('reg.status IN (:...statuses)', { statuses: ['registered', 'completed'] })
            .andWhere('reg.menu_item_id IS NOT NULL')
            .groupBy('reg.menu_item_id')
            .getRawMany();

          const nullMenuItemStat = await this.registrationRepo.createQueryBuilder('reg')
            .select('COUNT(reg.id)', 'count')
            .where('reg.menu_id = :menuId', { menuId: Number(menu.id) })
            .andWhere('reg.status IN (:...statuses)', { statuses: ['registered', 'completed'] })
            .andWhere('reg.menu_item_id IS NULL')
            .getRawOne();

          const regMap: Record<number, number> = {};
          regStats.forEach(rs => {
            if (rs.menuItemId) regMap[Number(rs.menuItemId)] = parseInt(rs.count);
          });

          const nullMenuItemCount = Number(nullMenuItemStat?.count || 0);
          if (nullMenuItemCount > 0 && Array.isArray(menu.items) && menu.items.length === 1) {
            const onlyItemId = Number(menu.items[0]?.id);
            if (onlyItemId) {
              regMap[onlyItemId] = (regMap[onlyItemId] || 0) + nullMenuItemCount;
            }
          }

          menuObj[slot] = (menu.items || []).map((item) => {
            const actual = (actualServings || []).find(as => Number(as.menu_item_id) === Number(item.id));
            return {
              id: item.dish_id,
              menu_item_id: item.id,
              name: item.dish?.name || 'MÃ³n Äƒn khÃ´ng tÃªn',
              price: Number(item.unit_price_snapshot),
              supplierName: item.supplier?.name || item.dish?.supplier?.name || 'ChÆ°a chá»n NCC',
              actual_quantity: actual ? actual.actual_qty : 0,
              registered_quantity: regMap[Number(item.id)] || 0,
              unit: item.unit || 'suáº¥t'
            };
          });
        }
      }

      return {
        date,
        note: dayNote,
        menu: menuObj,
      };
    } catch (e) {
      log(`[MealService] ERROR in getDailyMenuDetail: ${e.message}\nStack: ${e.stack}`);
      throw e;
    }
  }


  async saveDailyMenuSetup(dto: DailyMenuSetupSaveDto, userId: string) {
    this.validateMenuNotLocked(dto.date);
    log(`[MealService] saveDailyMenuSetup called by user ${userId} for date ${dto.date}`);
    try {
      const { date, note, meals } = dto;

      await this.dataSource.transaction(async (manager) => {
        for (const slot of ['breakfast', 'lunch', 'dinner']) {
          let dishItems = meals[slot] || [];
          // Deduplicate by dish_id to avoid UQ_menu_dish constraint violation
          const uniqueMap = new Map();
          for (const item of dishItems) {
            const id = Number(item.dish_id);
            if (!uniqueMap.has(id)) uniqueMap.set(id, item);
          }
          dishItems = Array.from(uniqueMap.values());


          // 1. Find or create menu entry for this date/slot
          let menu = await manager.findOne(MenuEntity, {
            where: { menu_date: date, meal_slot: slot },
          });

          if (!menu) {
            menu = manager.create(MenuEntity, {
              menu_date: date,
              meal_slot: slot,
              status: 'published',
              register_deadline_at: moment(date).subtract(1, 'day').hour(16).toDate(),
              cancel_deadline_at: moment(date).hour(8).toDate(),
            });
          }
          menu.note = note || null;
          menu = await manager.save(menu);

          // 2. Sync dishes
          const existingItems = await manager.find(MenuItemEntity, { where: { menu_id: Number(menu.id) } });

          const dishIdsToKeep = dishItems.map(i => Number(i.dish_id));
          const itemsToRemove = existingItems.filter(ei => !dishIdsToKeep.includes(Number(ei.dish_id)));
          if (itemsToRemove.length > 0) {
            await manager.remove(itemsToRemove);
          }

          // Add or Update items
          for (let i = 0; i < dishItems.length; i++) {
            const dItem = dishItems[i];
            let menuItem = existingItems.find(ei => Number(ei.dish_id) === Number(dItem.dish_id));

            if (!menuItem) {
              const dish = await manager.findOne(DishEntity, { where: { id: Number(dItem.dish_id) } });
              menuItem = manager.create(MenuItemEntity, {
                menu_id: Number(menu!.id),
                dish_id: Number(dItem.dish_id),
                sort_order: i,
                unit: dish?.unit || 'suáº¥t',
                unit_price_snapshot: dish?.price || 0,
                supplier_id: dish?.supplier_id || null,
              });
              menuItem = await manager.save(menuItem);
            } else {
              menuItem.sort_order = i;
              await manager.save(menuItem);
            }

            // 3. Update actual quantity
            if (dItem.actual_qty !== undefined && dItem.actual_qty !== null) {
              let actual = await manager.findOne(MealActualServingEntity, {
                where: { menu_id: Number(menu!.id), menu_item_id: Number(menuItem.id) }
              });

              if (!actual) {
                actual = manager.create(MealActualServingEntity, {
                  menu_id: Number(menu!.id),
                  menu_item_id: Number(menuItem.id),
                  actual_qty: dItem.actual_qty,
                  recorded_at: new Date(),
                  recorded_by: userId,
                  source: 'manual'
                });
              } else {
                actual.actual_qty = dItem.actual_qty;
                actual.updated_at = new Date();
              }
              await manager.save(actual);
            }
          }
        }
      });

      return { success: true };
    } catch (error) {
      log(`[MealService] ERROR in saveDailyMenuSetup: ${error.message}`);
      throw error;
    }
  }

  async saveWeeklyMenuV2(dto: WeeklyMenuSaveDto, userId: string) {
    this.validateMenuNotLocked(dto.startDate);
    log(`[MealService] saveWeeklyMenuV2 called by user ${userId} for startDate ${dto.startDate}`);
    try {
      const { startDate, days } = dto;

      await this.dataSource.transaction(async (manager) => {
        for (const day of days) {
          const date = day.date;
          const meals = day.meals;

          for (const slot of ['breakfast', 'lunch', 'dinner']) {
            let dishIds = meals[slot] || [];
            // Deduplicate dishes to avoid UQ_menu_dish constraint violation
            dishIds = Array.from(new Set(dishIds.map(id => Number(id))));


            // 1. Find or create menu entry for this date/slot
            let menu = await manager.findOne(MenuEntity, {
              where: { menu_date: date, meal_slot: slot },
            });

            if (!menu) {
              menu = manager.create(MenuEntity, {
                menu_date: date,
                meal_slot: slot,
                status: 'draft',
                register_deadline_at: moment(date).subtract(1, 'day').hour(16).toDate(),
                cancel_deadline_at: moment(date).hour(8).toDate(),
              });
              menu = await manager.save(menu);
            }

            // 2. Clear existing items for this menu slot
            await manager.delete(MenuItemEntity, { menu_id: Number(menu.id) });

            // 3. Add new items
            if (dishIds.length > 0) {
              const items: MenuItemEntity[] = [];
              for (let i = 0; i < dishIds.length; i++) {
                const dishId = dishIds[i];
                const dish = await manager.findOne(DishEntity, { where: { id: Number(dishId) } });
                items.push(manager.create(MenuItemEntity, {
                  menu_id: Number(menu!.id),
                  dish_id: Number(dishId),
                  sort_order: i,
                  unit: dish?.unit || 'suáº¥t',
                  unit_price_snapshot: dish?.price || 0,
                  supplier_id: dish?.supplier_id || null,
                }));
              }
              await manager.save(items);
            }
          }
        }
      });

      return { success: true };
    } catch (error) {
      log(`[MealService] ERROR in saveWeeklyMenuV2: ${error.message}`);
      throw error;
    }
  }

  async getDailyMenuPrintData(date: string) {
    const menuDetail = await this.getDailyMenuDetail(date);
    const summary = await this.getDailySummary(date);

    return {
      ...menuDetail,
      summary
    };
  }

  async exportDailyMenuExcel(date: string) {
    const data = await this.getDailyMenuPrintData(date);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Thá»±c Ä‘Æ¡n ngÃ y');

    // Title
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `THá»°C ÄÆ N NGÃ€Y ${moment(date).format('DD/MM/YYYY')}`;
    titleCell.font = { name: 'Arial', size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Summary Stats
    sheet.mergeCells('A2:F2');
    const summaryCell = sheet.getCell('A2');
    const totalAct = Object.values(data.menu).reduce((sum: number, slot: any[]) => sum + slot.reduce((s, i) => s + (i.actual_quantity || 0), 0), 0);
    summaryCell.value = `Tá»•ng Ä‘Äƒng kÃ½: ${data.summary.total} | Thá»±c táº¿ sá»­ dá»¥ng: ${totalAct} | ChÃªnh lá»‡ch: ${totalAct - data.summary.total}`;
    summaryCell.font = { name: 'Arial', size: 11, italic: true };
    summaryCell.alignment = { horizontal: 'center' };

    // Headers
    const headerRow = sheet.addRow(['Bá»¯a Äƒn', 'MÃ³n Äƒn', 'NhÃ  cung cáº¥p', 'ÄÄƒng kÃ½', 'Thá»±c táº¿', 'ChÃªnh lá»‡ch']);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Content
    const mealLabels: Record<string, string> = { breakfast: 'Bữa sáng', lunch: 'Bữa trưa', dinner: 'Bữa tối' };

    ['breakfast', 'lunch', 'dinner'].forEach(slotKey => {
      const items = data.menu[slotKey] || [];
      const slotReg = data.summary[slotKey] || 0;
      const slotAct = items.reduce((sum: number, i) => sum + (i.actual_quantity || 0), 0);

      if (items.length > 0) {
        items.forEach((item, idx) => {
          const itemReg = items.length > 0 ? Math.round(slotReg / items.length) : 0;
          const row = sheet.addRow([
            idx === 0 ? mealLabels[slotKey] : '',
            item.name,
            item.supplierName,
            itemReg,
            item.actual_quantity || 0,
            (item.actual_quantity || 0) - itemReg
          ]);

          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        });

        // Add Slot Summary Row
        const summaryRow = sheet.addRow([
          `Tá»•ng ${mealLabels[slotKey]}`,
          '',
          '',
          slotReg,
          slotAct,
          slotAct - slotReg
        ]);
        summaryRow.font = { bold: true, italic: true };
        summaryRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    // Styling
    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 30;
    sheet.getColumn(3).width = 25;
    sheet.getColumn(4).width = 12;
    sheet.getColumn(5).width = 12;
    sheet.getColumn(6).width = 12;

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      buffer,
      fileName: `Thuc-don-ngay-${date}.xlsx`
    };
  }

  async exportSupplierEvaluationsExcel(params: any) {
    const { supplier_id, from_date, to_date } = params;
    const query = this.evaluationRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.supplier', 's')
      .leftJoinAndSelect('e.dish', 'd')
      .leftJoinAndSelect('e.scores', 'sc')
      .where('e.deleted_at IS NULL')
      .andWhere("e.evaluation_status IN ('submitted', 'reviewed')");

    if (supplier_id && supplier_id !== 'ALL') {
      query.andWhere('e.supplier_id = :supplierId', { supplierId: supplier_id });
    }

    if (from_date && to_date) {
      query.andWhere('e.created_at BETWEEN :start AND :end', {
        start: moment(from_date).startOf('day').toDate(),
        end: moment(to_date).endOf('day').toDate()
      });
    }

    query.orderBy('e.created_at', 'DESC');
    const evaluations = await query.getMany();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('ÄÃ¡nh giÃ¡ NCC');

    // Title
    sheet.mergeCells('A1:K1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'BÃO CÃO ÄÃNH GIÃ CHáº¤T LÆ¯á»¢NG NHÃ€ CUNG Cáº¤P';
    titleCell.font = { name: 'Arial', size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Headers
    const headers = [
      'STT', 'NhÃ  cung cáº¥p', 'MÃ³n Äƒn', 'NgÃ y Ä‘Ã¡nh giÃ¡',
      'Cháº¥t lÆ°á»£ng mÃ³n', 'ÄÃºng giá» giao', 'Vá»‡ sinh an toÃ n', 'ThÃ¡i Ä‘á»™ phá»¥c vá»¥',
      'Äiá»ƒm trung bÃ¬nh', 'Xáº¿p loáº¡i', 'Nháº­n xÃ©t'
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.height = 25;
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Content
    evaluations.forEach((e, idx) => {
      const getScore = (code: string) => e.scores.find(s => s.criterion_code === code)?.score || 0;

      const rowData = [
        idx + 1,
        e.supplier?.name || '',
        e.dish?.name || '',
        moment(e.created_at).format('DD/MM/YYYY HH:mm'),
        getScore('food_quality'),
        getScore('delivery_time'),
        getScore('hygiene_safety_score'),
        getScore('service_attitude_score'),
        Number(e.overall_score) || 0,
        e.overall_rating || '',
        e.comment || ''
      ];

      const row = sheet.addRow(rowData);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
      // STT column alignment
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      // Scores alignment
      for (let i = 5; i <= 9; i++) {
        row.getCell(i).alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    // Column widths
    sheet.getColumn(1).width = 8;   // STT
    sheet.getColumn(2).width = 30;  // NCC
    sheet.getColumn(3).width = 30;  // MÃ³n
    sheet.getColumn(4).width = 20;  // NgÃ y
    sheet.getColumn(5).width = 15;  // Score 1
    sheet.getColumn(6).width = 15;  // Score 2
    sheet.getColumn(7).width = 15;  // Score 3
    sheet.getColumn(8).width = 15;  // Score 4
    sheet.getColumn(9).width = 15;  // Overall
    sheet.getColumn(10).width = 15; // Rating
    sheet.getColumn(11).width = 40; // Comment

    const buffer = await workbook.xlsx.writeBuffer() as any;
    return {
      buffer,
      fileName: `Bao-cao-danh-gia-NCC-${moment().format('YYYYMMDD-HHmm')}.xlsx`
    };
  }
}



