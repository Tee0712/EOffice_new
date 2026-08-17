-- =========================================================================
-- Migration: Event Management & Satisfaction Survey (PH02)
-- Database: MSSQL (app_tancang)
-- Description: Schema for Events, Programs, Guests, Logistics & Satisfaction Survey
-- =========================================================================

-- 1. EVENTS
IF OBJECT_ID(N'[dbo].[events]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[events] (
    [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [title] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(MAX) NULL,
    [event_type] NVARCHAR(50) NOT NULL, -- HOI_NGHI, HOI_THAO, LE_KY_KET, NOI_BO, AN_SINH_XA_HOI
    [start_time] DATETIME2 NOT NULL,
    [end_time] DATETIME2 NOT NULL,
    [location] NVARCHAR(255) NOT NULL,
    [organizer_unit_id] NVARCHAR(100) NULL,
    [creator_id] NVARCHAR(100) NOT NULL,
    [status] NVARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, HAPPENING, COMPLETED, CANCELLED
    [created_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX [IX_events_creator_id] ON [dbo].[events]([creator_id]);
  CREATE INDEX [IX_events_status] ON [dbo].[events]([status]);
END
GO

-- 2. EVENT_PROGRAMS
IF OBJECT_ID(N'[dbo].[event_programs]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[event_programs] (
    [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [event_id] BIGINT NOT NULL REFERENCES [dbo].[events]([id]) ON DELETE CASCADE,
    [title] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(MAX) NULL,
    [start_time] DATETIME2 NOT NULL,
    [end_time] DATETIME2 NOT NULL,
    [speaker] NVARCHAR(255) NULL,
    [order_index] INT NOT NULL DEFAULT 0,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX [IX_event_programs_event_id] ON [dbo].[event_programs]([event_id]);
END
GO

-- 3. EVENT_GUESTS
IF OBJECT_ID(N'[dbo].[event_guests]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[event_guests] (
    [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [event_id] BIGINT NOT NULL REFERENCES [dbo].[events]([id]) ON DELETE CASCADE,
    [full_name] NVARCHAR(255) NOT NULL,
    [organization] NVARCHAR(255) NULL,
    [position] NVARCHAR(255) NULL,
    [email] NVARCHAR(255) NULL,
    [phone] NVARCHAR(50) NULL,
    [status] NVARCHAR(50) NOT NULL DEFAULT 'INVITED', -- INVITED, CONFIRMED, DECLINED, ATTENDED
    [created_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX [IX_event_guests_event_id] ON [dbo].[event_guests]([event_id]);
END
GO

-- 4. EVENT_LOGISTICS (HOTEL, TRANSPORT, CATERING)
IF OBJECT_ID(N'[dbo].[event_logistics]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[event_logistics] (
    [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [event_id] BIGINT NOT NULL REFERENCES [dbo].[events]([id]) ON DELETE CASCADE,
    [type] NVARCHAR(50) NOT NULL, -- HOTEL, TRANSPORT, CATERING
    [name] NVARCHAR(255) NOT NULL,
    [details] NVARCHAR(MAX) NULL,
    [cost] DECIMAL(18,2) NULL,
    [status] NVARCHAR(50) NOT NULL DEFAULT 'PENDING',
    [created_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX [IX_event_logistics_event_id] ON [dbo].[event_logistics]([event_id]);
END
GO

-- 5. EVENT_SATISFACTION_SURVEYS
IF OBJECT_ID(N'[dbo].[event_satisfaction_surveys]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[event_satisfaction_surveys] (
    [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [event_id] BIGINT NOT NULL REFERENCES [dbo].[events]([id]) ON DELETE CASCADE,
    [title] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(MAX) NULL,
    [questions_json] NVARCHAR(MAX) NOT NULL,
    [is_active] BIT NOT NULL DEFAULT 1,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX [IX_event_surveys_event_id] ON [dbo].[event_satisfaction_surveys]([event_id]);
END
GO

-- 6. EVENT_SATISFACTION_RESPONSES
IF OBJECT_ID(N'[dbo].[event_satisfaction_responses]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[event_satisfaction_responses] (
    [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [survey_id] BIGINT NOT NULL REFERENCES [dbo].[event_satisfaction_surveys]([id]) ON DELETE CASCADE,
    [user_id] NVARCHAR(100) NOT NULL,
    [answers_json] NVARCHAR(MAX) NOT NULL,
    [overall_rating] INT NOT NULL,
    [feedback] NVARCHAR(MAX) NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX [IX_event_responses_survey_id] ON [dbo].[event_satisfaction_responses]([survey_id]);
END
GO
