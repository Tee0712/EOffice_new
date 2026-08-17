-- ============================================================
-- Migration: Rename canteen tables to meal tables
-- ============================================================
-- Mục đích: Đổi tên các bảng từ canteen_* → meal_*
-- Author: AI Assistant
-- Date: 2026-08-17
-- ============================================================

BEGIN TRANSACTION;

PRINT '=== Bat dau migration: Doi ten bang canteen → meal ===';

-- 1. Đổi tên bảng canteen_registrations → meal_bookings
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'canteen_registrations')
BEGIN
    EXEC sp_rename 'canteen_registrations', 'meal_bookings';
    PRINT 'Da doi: canteen_registrations → meal_bookings';
END
ELSE
    PRINT 'Bang canteen_registrations khong ton tai, bo qua';

-- 2. Đổi tên bảng canteen_system_settings → meal_system_settings
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'canteen_system_settings')
BEGIN
    EXEC sp_rename 'canteen_system_settings', 'meal_system_settings';
    PRINT 'Da doi: canteen_system_settings → meal_system_settings';
END
ELSE
    PRINT 'Bang canteen_system_settings khong ton tai, bo qua';

-- 3. Đổi tên bảng canteen_user_settings → meal_user_settings
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'canteen_user_settings')
BEGIN
    EXEC sp_rename 'canteen_user_settings', 'meal_user_settings';
    PRINT 'Da doi: canteen_user_settings → meal_user_settings';
END
ELSE
    PRINT 'Bang canteen_user_settings khong ton tai, bo qua';

-- 4. Cap nhat foreign key references trong registration_items
DECLARE @fkName NVARCHAR(128);
SELECT @fkName = fk.name
FROM sys.foreign_keys fk
INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
WHERE t.name = 'registration_items'
  AND fk.name LIKE '%canteen%';

IF @fkName IS NOT NULL
BEGIN
    EXEC sp_rename @fkName, REPLACE(@fkName, 'canteen', 'meal');
    PRINT 'Da doi ten FK: ' + @fkName;
END

-- 5. Cap nhat foreign key references trong registration_history
DECLARE @fkName2 NVARCHAR(128);
SELECT @fkName2 = fk.name
FROM sys.foreign_keys fk
INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
WHERE t.name = 'registration_history'
  AND fk.name LIKE '%canteen%';

IF @fkName2 IS NOT NULL
BEGIN
    EXEC sp_rename @fkName2, REPLACE(@fkName2, 'canteen', 'meal');
    PRINT 'Da doi ten FK: ' + @fkName2;
END

-- 6. Cap nhat unique constraint
DECLARE @uqName NVARCHAR(128);
SELECT @uqName = k.name
FROM sys.key_constraints k
INNER JOIN sys.tables t ON k.parent_object_id = t.object_id
WHERE t.name = 'meal_bookings'
  AND k.name LIKE '%canteen%';

IF @uqName IS NOT NULL
BEGIN
    EXEC sp_rename 'meal_bookings.' + @uqName, REPLACE(@uqName, 'canteen', 'meal'), 'OBJECT';
    PRINT 'Da doi ten UQ: ' + @uqName;
END

PRINT '=== Hoan thanh migration: Doi ten bang canteen → meal ===';

COMMIT TRANSACTION;

-- ============================================================
-- ROLLBACK (chay neu can rollback):
-- ============================================================
-- BEGIN TRANSACTION;
-- EXEC sp_rename 'meal_bookings', 'canteen_registrations';
-- EXEC sp_rename 'meal_system_settings', 'canteen_system_settings';
-- EXEC sp_rename 'meal_user_settings', 'canteen_user_settings';
-- COMMIT TRANSACTION;
