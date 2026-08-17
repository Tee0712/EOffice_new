-- ============================================================
-- Migration: Rename canteen tables to meal tables
-- ============================================================
-- Muc dich: Doi ten cac bang tu canteen_* -> meal_*
-- Author: AI Assistant
-- Date: 2026-08-17
-- ============================================================

BEGIN TRANSACTION;

PRINT '=== Bat dau migration: Doi ten bang canteen -> meal ===';

-- 1. Doi ten bang canteen_registrations -> meal_bookings
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'canteen_registrations')
BEGIN
    EXEC sp_rename 'canteen_registrations', 'meal_bookings';
    PRINT 'Da doi: canteen_registrations -> meal_bookings';
END
ELSE
BEGIN
    PRINT 'Bang canteen_registrations khong ton tai, bo qua';
END

-- 2. Doi ten bang canteen_system_settings -> meal_system_settings
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'canteen_system_settings')
BEGIN
    EXEC sp_rename 'canteen_system_settings', 'meal_system_settings';
    PRINT 'Da doi: canteen_system_settings -> meal_system_settings';
END
ELSE
BEGIN
    PRINT 'Bang canteen_system_settings khong ton tai, bo qua';
END

-- 3. Doi ten bang canteen_user_settings -> meal_user_settings
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'canteen_user_settings')
BEGIN
    EXEC sp_rename 'canteen_user_settings', 'meal_user_settings';
    PRINT 'Da doi: canteen_user_settings -> meal_user_settings';
END
ELSE
BEGIN
    PRINT 'Bang canteen_user_settings khong ton tai, bo qua';
END

PRINT '=== Hoan thanh migration: Doi ten bang canteen -> meal ===';

COMMIT TRANSACTION;

PRINT '';
PRINT '=== Kiem tra ket qua ===';
SELECT name AS ten_bang FROM sys.tables WHERE name LIKE 'meal_%' ORDER BY name;

-- ============================================================
-- ROLLBACK (chay neu can rollback):
-- ============================================================
-- BEGIN TRANSACTION;
-- EXEC sp_rename 'meal_bookings', 'canteen_registrations';
-- EXEC sp_rename 'meal_system_settings', 'canteen_system_settings';
-- EXEC sp_rename 'meal_user_settings', 'canteen_user_settings';
-- COMMIT TRANSACTION;
