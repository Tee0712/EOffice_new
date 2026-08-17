-- =====================================================
-- Migration: Update feature codes from CANTEEN to MEAL
-- Chạy trong SQL Server Management Studio (SSMS)
-- =====================================================

USE [EOFFICE];

BEGIN TRANSACTION;

PRINT '=== Bắt đầu update feature codes: CANTEEN → MEAL ===';

-- 1. Update feature codes
UPDATE feature_management 
SET code = REPLACE(code, 'CANTEEN', 'MEAL'),
    api_url = REPLACE(api_url, '/canteen', '/meals'),
    url = REPLACE(url, '/canteen', '/meals'),
    name = REPLACE(name, 'Canteen', 'Meal'),
    name = REPLACE(name, 'canteen', 'meal'),
    updated_at = GETDATE()
WHERE code LIKE 'CANTEEN%';

PRINT '✓ Đã update ' + CAST(@@ROWCOUNT AS VARCHAR) + ' feature codes';

-- 2. Update menu_managers (menu items pointing to canteen URLs)
UPDATE menu_managers
SET menu_url = REPLACE(menu_url, '/canteen', '/meals'),
    menu_action = REPLACE(menu_action, '/canteen', '/meals'),
    updated_at = GETDATE()
WHERE menu_url LIKE '/canteen%' OR menu_action LIKE '/canteen%';

PRINT '✓ Đã update menu_managers entries';

-- 3. Kiểm tra kết quả
PRINT '';
PRINT '=== Danh sách Features MEAL ===';
SELECT id, code, name, url, api_url, feature_type 
FROM feature_management 
WHERE code LIKE 'MEAL%'
ORDER BY code;

PRINT '';
PRINT '=== Script hoàn thành! ===';

COMMIT TRANSACTION;

-- ============================================================
-- ROLLBACK (chạy nếu cần rollback):
-- ============================================================
-- BEGIN TRANSACTION;
-- UPDATE feature_management 
-- SET code = REPLACE(code, 'MEAL', 'CANTEEN'),
--     api_url = REPLACE(api_url, '/meals', '/canteen'),
--     url = REPLACE(url, '/meals', '/canteen'),
--     name = REPLACE(name, 'Meal', 'Canteen'),
--     updated_at = GETDATE()
-- WHERE code LIKE 'MEAL%';
-- UPDATE menu_managers
-- SET menu_url = REPLACE(menu_url, '/meals', '/canteen'),
--     menu_action = REPLACE(menu_action, '/meals', '/canteen'),
--     updated_at = GETDATE()
-- WHERE menu_url LIKE '/meals%' OR menu_action LIKE '/meals%';
-- COMMIT TRANSACTION;
