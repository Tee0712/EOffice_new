-- =====================================================
-- Script: Them menu "An ca & Suat an" vao CMS sidebar
-- Chay trong SQL Server Management Studio (SSMS)
-- =====================================================

USE [app_tancang];

BEGIN TRANSACTION;

PRINT '=== Them menu An ca & Suat an vao CMS ===';

-- 1. Kiem tra feature da ton tai chua
DECLARE @MealListId NVARCHAR(100);
SELECT @MealListId = id FROM feature_management WHERE code = 'MEAL_LIST';

IF @MealListId IS NULL
BEGIN
    SET @MealListId = NEWID();

    INSERT INTO feature_management (
        id, code, name, url, api_url, feature_type,
        status_feature, status, created_at, updated_at
    ) VALUES (
        @MealListId,
        N'MEAL_LIST',
        N'Quan ly An ca & Suat an',
        N'/meals',
        N'/v1/meals',
        N'list',
        N'1',
        1,
        GETDATE(),
        GETDATE()
    );

    PRINT 'Da them feature MEAL_LIST';
END
ELSE
BEGIN
    PRINT 'Feature MEAL_LIST da ton tai';
END

-- 2. Them menu item vao menu_managers (neu chua co)
DECLARE @MenuId NVARCHAR(100);
SELECT @MenuId = id FROM menu_managers WHERE menu_url = '/meals';

IF @MenuId IS NULL
BEGIN
    SET @MenuId = NEWID();

    INSERT INTO menu_managers (
        id,
        menu_name,
        menu_url,
        menu_icon,
        menu_action,
        menu_parent_id,
        menu_sort,
        menu_type,
        menu_status,
        menu_position,
        feature_id,
        status,
        created_at,
        updated_at
    ) VALUES (
        @MenuId,
        N'An ca & Suat an',
        N'/meals',
        N'utensils',
        N'/meals',
        NULL,
        99,
        N'menu',
        1,
        N'sidebar',
        @MealListId,
        1,
        GETDATE(),
        GETDATE()
    );

    PRINT 'Da them menu cha: An ca & Suat an';

    -- 3. Them cac sub-menu items
    INSERT INTO menu_managers (id, menu_name, menu_url, menu_icon, menu_action, menu_parent_id, menu_sort, menu_type, menu_status, menu_position, feature_id, status, created_at, updated_at)
    VALUES
        (NEWID(), N'Dang ky an', N'/meals/calendar', N'calendar', N'/meals/calendar', @MenuId, 1, N'menu', 1, N'sidebar', @MealListId, 1, GETDATE(), GETDATE()),
        (NEWID(), N'Dang ky cua toi', N'/meals/my-registrations', N'user-check', N'/meals/my-registrations', @MenuId, 2, N'menu', 1, N'sidebar', @MealListId, 1, GETDATE(), GETDATE()),
        (NEWID(), N'Lich su dang ky', N'/meals/history', N'history', N'/meals/history', @MenuId, 3, N'menu', 1, N'sidebar', @MealListId, 1, GETDATE(), GETDATE());

    PRINT 'Da them sub-menu: Dang ky an, Dang ky cua toi, Lich su';

    -- 4. Sub-menu cho Admin
    INSERT INTO menu_managers (id, menu_name, menu_url, menu_icon, menu_action, menu_parent_id, menu_sort, menu_type, menu_status, menu_position, feature_id, status, created_at, updated_at)
    VALUES
        (NEWID(), N'Dashboard Tong hop', N'/meals/admin', N'dashboard', N'/meals/admin', @MenuId, 10, N'menu', 1, N'sidebar', @MealListId, 1, GETDATE(), GETDATE()),
        (NEWID(), N'Quan ly Menu', N'/meals/menus', N'utensils', N'/meals/menus', @MenuId, 11, N'menu', 1, N'sidebar', @MealListId, 1, GETDATE(), GETDATE()),
        (NEWID(), N'Check-in Suat an', N'/meals/check-in', N'qr-code', N'/meals/check-in', @MenuId, 12, N'menu', 1, N'sidebar', @MealListId, 1, GETDATE(), GETDATE()),
        (NEWID(), N'Doi sot', N'/meals/reconciliation', N'file-text', N'/meals/reconciliation', @MenuId, 13, N'menu', 1, N'sidebar', @MealListId, 1, GETDATE(), GETDATE()),
        (NEWID(), N'Nha cung cap', N'/meals/suppliers', N'truck', N'/meals/suppliers', @MenuId, 14, N'menu', 1, N'sidebar', @MealListId, 1, GETDATE(), GETDATE()),
        (NEWID(), N'Cai dat', N'/meals/settings', N'settings', N'/meals/settings', @MenuId, 99, N'menu', 1, N'sidebar', @MealListId, 1, GETDATE(), GETDATE());

    PRINT 'Da them sub-menu Admin';
END
ELSE
BEGIN
    PRINT 'Menu /meals da ton tai trong menu_managers';
END

-- 5. Kiem tra ket qua
PRINT '';
PRINT '=== Danh sach menu An ca ===';
SELECT id, menu_name, menu_url, menu_parent_id
FROM menu_managers
WHERE menu_url LIKE '/meals%' OR menu_name LIKE N'%an ca%'
ORDER BY menu_sort;

PRINT '';
PRINT '=== Script hoan thanh! ===';
PRINT '';
PRINT '=== Huong dan ===';
PRINT '1. Reload trang CMS de thay menu moi';
PRINT '2. Neu menu khong hien, kiem tra quyen trong Role Management';

COMMIT TRANSACTION;
