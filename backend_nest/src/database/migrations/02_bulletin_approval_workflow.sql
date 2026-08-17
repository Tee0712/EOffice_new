-- =========================================================================
-- Migration: Bulletin Management & Department Approval Workflow (PH01 & PH02)
-- Database: MSSQL (app_tancang)
-- Description: Schema for Bulletin Management, Dynamic Approval Workflows & RBAC
-- =========================================================================

-- 1. BULLETIN DEPARTMENTS
IF OBJECT_ID(N'[dbo].[bulletin_departments]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[bulletin_departments] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_bulletin_departments] PRIMARY KEY DEFAULT NEWID(),
    [name] NVARCHAR(255) NOT NULL,
    [code] NVARCHAR(50) NOT NULL CONSTRAINT [UQ_bulletin_departments_code] UNIQUE,
    [description] NVARCHAR(MAX) NULL,
    [created_at] DATETIME NOT NULL CONSTRAINT [DF_bulletin_departments_created_at] DEFAULT GETDATE(),
    [updated_at] DATETIME NOT NULL CONSTRAINT [DF_bulletin_departments_updated_at] DEFAULT GETDATE()
  );
END
GO

-- 2. BULLETIN ROLES
IF OBJECT_ID(N'[dbo].[bulletin_roles]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[bulletin_roles] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_bulletin_roles] PRIMARY KEY DEFAULT NEWID(),
    [name] NVARCHAR(100) NOT NULL,
    [code] NVARCHAR(50) NOT NULL CONSTRAINT [UQ_bulletin_roles_code] UNIQUE,
    [description] NVARCHAR(MAX) NULL
  );
END
GO

-- 3. BULLETIN PERMISSIONS
IF OBJECT_ID(N'[dbo].[bulletin_permissions]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[bulletin_permissions] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_bulletin_permissions] PRIMARY KEY DEFAULT NEWID(),
    [name] NVARCHAR(100) NOT NULL,
    [code] NVARCHAR(50) NOT NULL CONSTRAINT [UQ_bulletin_permissions_code] UNIQUE,
    [description] NVARCHAR(MAX) NULL
  );
END
GO

-- 4. DEPARTMENT APPROVAL WORKFLOWS
IF OBJECT_ID(N'[dbo].[department_approval_workflows]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[department_approval_workflows] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_dept_approval_workflows] PRIMARY KEY DEFAULT NEWID(),
    [department_id] UNIQUEIDENTIFIER NOT NULL,
    [step_order] INT NOT NULL,
    [approver_type] NVARCHAR(50) NOT NULL, -- BY_ROLE, BY_USER
    [approver_id] NVARCHAR(100) NOT NULL,
    [step_name] NVARCHAR(255) NULL,
    [sla_hours] INT NULL,
    [is_required] BIT NOT NULL CONSTRAINT [DF_dept_workflows_is_required] DEFAULT 1,
    [min_approvals] INT NOT NULL CONSTRAINT [DF_dept_workflows_min_approvals] DEFAULT 1,
    [can_auto_publish] BIT NOT NULL CONSTRAINT [DF_dept_workflows_can_auto_publish] DEFAULT 0,
    [publish_channel] NVARCHAR(100) NULL,
    [notify_scope] NVARCHAR(100) NULL,
    [on_reject_action] NVARCHAR(50) NOT NULL CONSTRAINT [DF_dept_workflows_on_reject] DEFAULT 'RETURN_TO_DRAFT',
    [is_active] BIT NOT NULL CONSTRAINT [DF_dept_workflows_is_active] DEFAULT 1,
    [config_json] NVARCHAR(MAX) NULL
  );
  CREATE INDEX [IX_dept_workflows_dept_id] ON [dbo].[department_approval_workflows]([department_id]);
END
GO

-- 5. BULLETINS
IF OBJECT_ID(N'[dbo].[bulletins]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[bulletins] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_bulletins] PRIMARY KEY DEFAULT NEWID(),
    [title] NVARCHAR(500) NOT NULL,
    [content] NVARCHAR(MAX) NOT NULL,
    [bulletin_type] NVARCHAR(50) NOT NULL CONSTRAINT [DF_bulletins_bulletin_type] DEFAULT 'NEWS',
    [priority] NVARCHAR(20) NOT NULL CONSTRAINT [DF_bulletins_priority] DEFAULT 'NORMAL',
    [department_id] UNIQUEIDENTIFIER NOT NULL,
    [author_id] NVARCHAR(100) NOT NULL,
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [DF_bulletins_status] DEFAULT 'DRAFT',
    [current_step] INT NOT NULL CONSTRAINT [DF_bulletins_current_step] DEFAULT 1,
    [tags] NVARCHAR(MAX) NULL,
    [attachments] NVARCHAR(MAX) NULL,
    [scheduled_publish_at] DATETIME NULL,
    [scheduled_unpublish_at] DATETIME NULL,
    [view_count] INT NOT NULL CONSTRAINT [DF_bulletins_view_count] DEFAULT 0,
    [viewer_department_ids] NVARCHAR(MAX) NULL,
    [created_at] DATETIME NOT NULL CONSTRAINT [DF_bulletins_created_at] DEFAULT GETDATE(),
    [updated_at] DATETIME NOT NULL CONSTRAINT [DF_bulletins_updated_at] DEFAULT GETDATE()
  );

  CREATE INDEX [IX_bulletins_department_id] ON [dbo].[bulletins]([department_id]);
  CREATE INDEX [IX_bulletins_author_id] ON [dbo].[bulletins]([author_id]);
  CREATE INDEX [IX_bulletins_status] ON [dbo].[bulletins]([status]);
END
GO

-- 6. BULLETIN APPROVAL HISTORIES
IF OBJECT_ID(N'[dbo].[bulletin_approval_histories]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[bulletin_approval_histories] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_bulletin_approval_histories] PRIMARY KEY DEFAULT NEWID(),
    [bulletin_id] UNIQUEIDENTIFIER NOT NULL,
    [step_order] INT NOT NULL,
    [actor_id] NVARCHAR(100) NOT NULL,
    [action] NVARCHAR(50) NOT NULL, -- SUBMITTED, APPROVED, REJECTED, REQUEST_EDIT, PUBLISHED, UNPUBLISHED
    [comment] NVARCHAR(MAX) NULL,
    [created_at] DATETIME NOT NULL CONSTRAINT [DF_bulletin_approval_histories_created_at] DEFAULT GETDATE()
  );

  CREATE INDEX [IX_bulletin_approval_histories_bulletin_id] ON [dbo].[bulletin_approval_histories]([bulletin_id]);
END
GO
