-- ============================================================
-- Migration: Create meal_reconciliations table
-- ============================================================
-- Mục đích: Tạo bảng để lưu trữ thông tin đối soát suất ăn
-- Author: AI Assistant
-- Date: 2026-08-17
-- ============================================================

USE [app_tancang];

BEGIN TRANSACTION;

PRINT '=== Tạo bảng meal_reconciliations ===';

-- Tạo bảng meal_reconciliations nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'meal_reconciliations')
BEGIN
    CREATE TABLE meal_reconciliations (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        reconciliation_month VARCHAR(7) NOT NULL, -- YYYY-MM format
        department_id NVARCHAR(100) NULL,
        department_name NVARCHAR(500) NULL,
        total_registered INT NOT NULL DEFAULT 0,
        total_checked_in INT NOT NULL DEFAULT 0,
        total_cancelled INT NOT NULL DEFAULT 0,
        total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
        refund_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
        final_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
        reconciliation_date DATE NULL,
        reconciled_by NVARCHAR(100) NULL,
        reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | approved | rejected
        approved_by NVARCHAR(100) NULL,
        approved_at DATETIME2 NULL,
        notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_meal_recon_month_dept UNIQUE (reconciliation_month, department_id)
    );

    PRINT '✓ Đã tạo bảng meal_reconciliations';
END
ELSE
    PRINT '⚠ Bảng meal_reconciliations đã tồn tại, bỏ qua';

PRINT '=== Hoàn thành tạo bảng meal_reconciliations ===';

COMMIT TRANSACTION;

-- ============================================================
-- ROLLBACK:
-- ============================================================
-- DROP TABLE IF EXISTS meal_reconciliations;
