-- =========================================================================
-- Migration: Canteen Management System (PH12)
-- Database: MSSQL (app_tancang)
-- Description: Complete schema for Meal Registration, Menu, Check-in & SRS
-- =========================================================================

-- 1. MEAL_SESSIONS
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'meal_sessions') AND type = 'U')
BEGIN
  CREATE TABLE meal_sessions (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    name        NVARCHAR(50)  NOT NULL,           -- Ăn sáng | Ăn trưa | Ăn tối
    time_start  VARCHAR(10)   NOT NULL,            -- HH:mm
    time_end    VARCHAR(10)   NOT NULL,
    icon        NVARCHAR(255) NULL,
    sort_order  INT           NOT NULL DEFAULT 0
  );

  INSERT INTO meal_sessions (name, time_start, time_end, icon, sort_order) VALUES
    (N'Ăn sáng', '06:30', '08:00', NULL, 1),
    (N'Ăn trưa', '11:00', '13:00', NULL, 2),
    (N'Ăn tối',  '17:30', '19:00', NULL, 3);
END
GO

-- 2. DAILY_MENUS
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'daily_menus') AND type = 'U')
BEGIN
  CREATE TABLE daily_menus (
    id               BIGINT IDENTITY(1,1) PRIMARY KEY,
    date             DATE          NOT NULL,
    meal_session_id  INT           NOT NULL REFERENCES meal_sessions(id),
    is_active        BIT           NOT NULL DEFAULT 1,
    dish_name        NVARCHAR(500) NOT NULL,
    description      NVARCHAR(MAX) NULL,
    price            DECIMAL(12,0) NOT NULL,
    serving_time     VARCHAR(20)   NULL,
    photo_url        NVARCHAR(500) NULL,
    created_by       NVARCHAR(100) NULL,
    updated_at       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_daily_menus_date_session UNIQUE (date, meal_session_id)
  );
  CREATE INDEX IX_daily_menus_date ON daily_menus(date);
END
GO

-- 3. CANTEEN_REGISTRATIONS
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'canteen_registrations') AND type = 'U')
BEGIN
  CREATE TABLE canteen_registrations (
    id            BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id       NVARCHAR(100) NOT NULL,
    date          DATE          NOT NULL,
    status        VARCHAR(20)   NOT NULL DEFAULT 'upcoming',  -- upcoming | active | completed | cancelled
    total_cost    DECIMAL(12,0) NOT NULL DEFAULT 0,
    note          NVARCHAR(500) NULL,
    registered_at DATETIME2     NULL,
    cancelled_at  DATETIME2     NULL,
    cancel_reason NVARCHAR(MAX) NULL,
    is_refunded   BIT           NOT NULL DEFAULT 0,
    refund_amount DECIMAL(12,0) NOT NULL DEFAULT 0,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_canteen_reg_user_date UNIQUE (user_id, date)
  );
  CREATE INDEX IX_canteen_reg_user_id ON canteen_registrations(user_id);
  CREATE INDEX IX_canteen_reg_date    ON canteen_registrations(date);
END
GO

-- 4. REGISTRATION_ITEMS
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'registration_items') AND type = 'U')
BEGIN
  CREATE TABLE registration_items (
    id               BIGINT IDENTITY(1,1) PRIMARY KEY,
    registration_id  BIGINT        NOT NULL REFERENCES canteen_registrations(id) ON DELETE CASCADE,
    meal_session_id  INT           NOT NULL REFERENCES meal_sessions(id),
    daily_menu_id    BIGINT        NOT NULL REFERENCES daily_menus(id),
    price_at_time    DECIMAL(12,0) NOT NULL,
    created_at       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_reg_item_reg_session UNIQUE (registration_id, meal_session_id)
  );
  CREATE INDEX IX_reg_items_registration_id ON registration_items(registration_id);
END
GO

-- 5. REGISTRATION_HISTORY
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'registration_history') AND type = 'U')
BEGIN
  CREATE TABLE registration_history (
    id               BIGINT IDENTITY(1,1) PRIMARY KEY,
    registration_id  BIGINT        NOT NULL REFERENCES canteen_registrations(id) ON DELETE CASCADE,
    action           VARCHAR(20)   NOT NULL,  -- created | updated | cancelled
    description      NVARCHAR(MAX) NULL,
    changed_by       NVARCHAR(100) NOT NULL,
    changed_at       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_reg_history_registration_id ON registration_history(registration_id);
END
GO

-- 6. MEAL_TEMPLATES
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'meal_templates') AND type = 'U')
BEGIN
  CREATE TABLE meal_templates (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    user_id       NVARCHAR(100) NULL,   -- NULL = system template
    name          NVARCHAR(200) NOT NULL,
    meal_sessions NVARCHAR(MAX) NOT NULL,  -- JSON array: [1,2]
    is_system     BIT           NOT NULL DEFAULT 0,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
  );

  INSERT INTO meal_templates (user_id, name, meal_sessions, is_system) VALUES
    (NULL, N'Ăn trưa T2-T6',     '[2]',     1),
    (NULL, N'Sáng + Trưa T2-T6', '[1,2]',   1),
    (NULL, N'Đầy đủ 3 bữa',      '[1,2,3]', 1);
END
GO

-- 7. CANTEEN_SYSTEM_SETTINGS
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'canteen_system_settings') AND type = 'U')
BEGIN
  CREATE TABLE canteen_system_settings (
    id                             INT IDENTITY(1,1) PRIMARY KEY,
    registration_deadline_time     VARCHAR(10)    NOT NULL DEFAULT '16:00',
    cancellation_deadline_time     VARCHAR(10)    NOT NULL DEFAULT '10:00',
    allow_multi_meal               BIT            NOT NULL DEFAULT 1,
    allow_bulk_registration        BIT            NOT NULL DEFAULT 1,
    auto_cancel_on_business_trip   BIT            NOT NULL DEFAULT 1,
    auto_cancel_on_leave           BIT            NOT NULL DEFAULT 1,
    require_cancel_reason          BIT            NOT NULL DEFAULT 0,
    weekend_service                BIT            NOT NULL DEFAULT 0,
    refund_rate_on_time            DECIMAL(5,2)   NOT NULL DEFAULT 100.00,
    refund_rate_late               DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
    updated_by                     NVARCHAR(100)  NULL,
    updated_at                     DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME()
  );

  INSERT INTO canteen_system_settings DEFAULT VALUES;
END
GO

-- 8. CANTEEN_USER_SETTINGS
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'canteen_user_settings') AND type = 'U')
BEGIN
  CREATE TABLE canteen_user_settings (
    id                        INT IDENTITY(1,1) PRIMARY KEY,
    user_id                   NVARCHAR(100) NOT NULL,
    auto_cancel_on_trip       BIT           NOT NULL DEFAULT 1,
    auto_cancel_on_leave      BIT           NOT NULL DEFAULT 1,
    receive_email_notification BIT          NOT NULL DEFAULT 1,
    remind_before_1_day       BIT           NOT NULL DEFAULT 0,
    updated_at                DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_canteen_user_settings_user UNIQUE (user_id)
  );
END
GO

-- 9. MEAL_EVALUATIONS
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'meal_evaluations') AND type = 'U')
BEGIN
  CREATE TABLE meal_evaluations (
    id                 BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id            NVARCHAR(100) NOT NULL,
    menu_id            BIGINT NOT NULL,
    supplier_id        BIGINT NULL,
    supplier_order_id  BIGINT NULL,
    taste_score        TINYINT NOT NULL,
    hygiene_score      TINYINT NOT NULL,
    portion_score      TINYINT NOT NULL,
    diversity_score    TINYINT NOT NULL,
    service_score      TINYINT NOT NULL,
    overall_score      DECIMAL(3, 2) NOT NULL,
    comment            NVARCHAR(MAX) NULL,
    images_json        NVARCHAR(MAX) NULL,
    created_at         DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO
