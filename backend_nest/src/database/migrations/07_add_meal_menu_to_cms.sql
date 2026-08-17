-- =====================================================
-- Script: Them menu "An ca & Suat an" vao CMS sidebar
-- Database: app_tancang
-- =====================================================

USE [app_tancang];

BEGIN TRANSACTION;

PRINT '=== Them menu An ca & Suat an vao CMS ===';

-- 1. Kiem tra da ton tai chua
DECLARE @ExistCode VARCHAR(100);
SELECT @ExistCode = code FROM menu_managers WHERE code = 'MEAL_LIST';

IF @ExistCode IS NULL
BEGIN
    -- 2. Them menu cha
    INSERT INTO menu_managers (
        id, name, code, settingIcon, hidden, dynamicMenu,
        "order", parent_id, function_code, status, path,
        managers, groupUsers, created_at, updated_at,
        code_router, roleGroupIds, code_app, collapsed
    ) VALUES (
        NEWID(),
        N'An ca & Suat an',
        'MEAL_LIST',
        'utensils',
        0,
        0,
        99,
        NULL,
        NULL,
        1,
        '/meals',
        NULL,
        NULL,
        GETDATE(),
        GETDATE(),
        '/meals',
        NULL,
        'CMS',
        0
    );

    PRINT 'Da them menu cha: An ca & Suat an';

    -- 3. Lay ID menu vua them
    DECLARE @ParentId VARCHAR(100);
    SELECT @ParentId = id FROM menu_managers WHERE code = 'MEAL_LIST';

    -- 4. Them sub-menu: Dang ky an
    INSERT INTO menu_managers (
        id, name, code, settingIcon, hidden, dynamicMenu,
        "order", parent_id, function_code, status, path,
        managers, groupUsers, created_at, updated_at,
        code_router, roleGroupIds, code_app, collapsed
    ) VALUES (NEWID(), N'Dang ky an', 'MEAL_CALENDAR', 'calendar', 0, 0, 1, @ParentId, NULL, 1, '/meals/calendar', NULL, NULL, GETDATE(), GETDATE(), '/meals/calendar', NULL, 'CMS', 0);

    -- 5. Them sub-menu: Dang ky cua toi
    INSERT INTO menu_managers (
        id, name, code, settingIcon, hidden, dynamicMenu,
        "order", parent_id, function_code, status, path,
        managers, groupUsers, created_at, updated_at,
        code_router, roleGroupIds, code_app, collapsed
    ) VALUES (NEWID(), N'Dang ky cua toi', 'MEAL_MY_REG', 'user-check', 0, 0, 2, @ParentId, NULL, 1, '/meals/my-registrations', NULL, NULL, GETDATE(), GETDATE(), '/meals/my-registrations', NULL, 'CMS', 0);

    -- 6. Them sub-menu: Lich su
    INSERT INTO menu_managers (
        id, name, code, settingIcon, hidden, dynamicMenu,
        "order", parent_id, function_code, status, path,
        managers, groupUsers, created_at, updated_at,
        code_router, roleGroupIds, code_app, collapsed
    ) VALUES (NEWID(), N'Lich su dang ky', 'MEAL_HISTORY', 'history', 0, 0, 3, @ParentId, NULL, 1, '/meals/history', NULL, NULL, GETDATE(), GETDATE(), '/meals/history', NULL, 'CMS', 0);

    -- 7. Them sub-menu: Admin - Dashboard
    INSERT INTO menu_managers (
        id, name, code, settingIcon, hidden, dynamicMenu,
        "order", parent_id, function_code, status, path,
        managers, groupUsers, created_at, updated_at,
        code_router, roleGroupIds, code_app, collapsed
    ) VALUES (NEWID(), N'Dashboard Tong hop', 'MEAL_ADMIN', 'dashboard', 0, 0, 10, @ParentId, NULL, 1, '/meals/admin', NULL, NULL, GETDATE(), GETDATE(), '/meals/admin', NULL, 'CMS', 0);

    -- 8. Them sub-menu: Quan ly Menu
    INSERT INTO menu_managers (
        id, name, code, settingIcon, hidden, dynamicMenu,
        "order", parent_id, function_code, status, path,
        managers, groupUsers, created_at, updated_at,
        code_router, roleGroupIds, code_app, collapsed
    ) VALUES (NEWID(), N'Quan ly Menu', 'MEAL_MENUS', 'utensils', 0, 0, 11, @ParentId, NULL, 1, '/meals/menus', NULL, NULL, GETDATE(), GETDATE(), '/meals/menus', NULL, 'CMS', 0);

    -- 9. Them sub-menu: Check-in
    INSERT INTO menu_managers (
        id, name, code, settingIcon, hidden, dynamicMenu,
        "order", parent_id, function_code, status, path,
        managers, groupUsers, created_at, updated_at,
        code_router, roleGroupIds, code_app, collapsed
    ) VALUES (NEWID(), N'Check-in Suat an', 'MEAL_CHECKIN', 'qrcode', 0, 0, 12, @ParentId, NULL, 1, '/meals/check-in', NULL, NULL, GETDATE(), GETDATE(), '/meals/check-in', NULL, 'CMS', 0);

    -- 10. Them sub-menu: Doi sot
    INSERT INTO menu_managers (
        id, name, code, settingIcon, hidden, dynamicMenu,
        "order", parent_id, function_code, status, path,
        managers, groupUsers, created_at, updated_at,
        code_router, roleGroupIds, code_app, collapsed
    ) VALUES (NEWID(), N'Doi sot', 'MEAL_RECONCILE', 'filetext', 0, 0, 13, @ParentId, NULL, 1, '/meals/reconciliation', NULL, NULL, GETDATE(), GETDATE(), '/meals/reconciliation', NULL, 'CMS', 0);

    -- 11. Them sub-menu: Nha cung cap
    INSERT INTO menu_managers (
        id, name, code, settingIcon, hidden, dynamicMenu,
        "order", parent_id, function_code, status, path,
        managers, groupUsers, created_at, updated_at,
        code_router, roleGroupIds, code_app, collapsed
    ) VALUES (NEWID(), N'Nha cung cap', 'MEAL_SUPPLIERS', 'truck', 0, 0, 14, @ParentId, NULL, 1, '/meals/suppliers', NULL, NULL, GETDATE(), GETDATE(), '/meals/suppliers', NULL, 'CMS', 0);

    -- 12. Them sub-menu: Cai dat
    INSERT INTO menu_managers (
        id, name, code, settingIcon, hidden, dynamicMenu,
        "order", parent_id, function_code, status, path,
        managers, groupUsers, created_at, updated_at,
        code_router, roleGroupIds, code_app, collapsed
    ) VALUES (NEWID(), N'Cai dat', 'MEAL_SETTINGS', 'settings', 0, 0, 99, @ParentId, NULL, 1, '/meals/settings', NULL, NULL, GETDATE(), GETDATE(), '/meals/settings', NULL, 'CMS', 0);

    PRINT 'Da them 9 sub-menu';
END
ELSE
BEGIN
    PRINT 'Menu MEAL_LIST da ton tai, bo qua';
END

-- 5. Kiem tra ket qua
PRINT '';
PRINT '=== Danh sach menu An ca ===';
SELECT id, name, code, path, "order", parent_id
FROM menu_managers
WHERE code LIKE 'MEAL%' OR name LIKE N'%An ca%'
ORDER BY "order";

PRINT '';
PRINT '=== Script hoan thanh! ===';

COMMIT TRANSACTION;
