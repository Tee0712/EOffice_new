-- =====================================================
-- Seed Script: Thêm feature codes cho module Ăn ca & Suất ăn
-- Chạy trong SQL Server Management Studio (SSMS)
-- =====================================================

USE [EOFFICE];

-- ============================================
-- 1. Kiểm tra và thêm Features cho Canteen
-- =====================================================

DECLARE @Features TABLE (
    code NVARCHAR(100),
    name NVARCHAR(500),
    url NVARCHAR(500),
    apiUrl NVARCHAR(500),
    featureType NVARCHAR(50)
);

INSERT INTO @Features VALUES
    (N'CANTEEN_LIST', N'Quản lý suất ăn', N'/canteen', N'/v1/canteen', N'list'),
    (N'CANTEEN_CALENDAR', N'Lịch đăng ký', N'/canteen/calendar', N'/v1/canteen/registrations', N'list'),
    (N'CANTEEN_MY_REG', N'Đăng ký của tôi', N'/canteen/my-registrations', N'/v1/canteen/registrations/my', N'list'),
    (N'CANTEEN_ADMIN', N'Dashboard Tổng hợp', N'/canteen/admin', N'/v1/canteen/admin/dashboard', N'custom'),
    (N'CANTEEN_CHECKIN', N'Check-in Suất ăn', N'/canteen/check-in', N'/v1/canteen/checkin', N'list'),
    (N'CANTEEN_MENU', N'Quản lý Menu', N'/canteen/menus', N'/v1/canteen/admin/menus', N'list'),
    (N'CANTEEN_RECONCILIATION', N'Đối soát suất ăn', N'/canteen/reconciliation', N'/v1/canteen/reconciliation', N'list'),
    (N'CANTEEN_SUPPLIER', N'Quản lý Nhà cung cấp', N'/canteen/suppliers', N'/v1/canteen/suppliers', N'list'),
    (N'CANTEEN_HISTORY', N'Lịch sử đăng ký', N'/canteen/history', N'/v1/canteen/registrations/history', N'list'),
    (N'CANTEEN_SETTINGS', N'Cài đặt hệ thống', N'/canteen/settings', N'/v1/canteen/admin/settings', N'list');

DECLARE @Code NVARCHAR(100), @Name NVARCHAR(500), @Url NVARCHAR(500), @ApiUrl NVARCHAR(500), @FeatureType NVARCHAR(50);
DECLARE @FeatureId NVARCHAR(100);

WHILE EXISTS (SELECT 1 FROM @Features)
BEGIN
    SELECT TOP 1 @Code = code, @Name = name, @Url = url, @ApiUrl = apiUrl, @FeatureType = featureType FROM @Features;
    
    -- Kiểm tra đã tồn tại chưa
    IF NOT EXISTS (SELECT 1 FROM feature_management WHERE code = @Code)
    BEGIN
        SET @FeatureId = NEWID();
        
        INSERT INTO feature_management (
            id,
            code,
            name,
            url,
            api_url,
            feature_type,
            status_feature,
            status,
            created_at,
            updated_at
        ) VALUES (
            @FeatureId,
            @Code,
            @Name,
            @Url,
            @ApiUrl,
            @FeatureType,
            N'1',
            1,
            GETDATE(),
            GETDATE()
        );
        
        PRINT '✓ Đã thêm feature: ' + @Name + ' (' + @Code + ')';
    END
    ELSE
    BEGIN
        PRINT '○ Feature đã tồn tại: ' + @Code;
    END
    
    DELETE FROM @Features WHERE code = @Code;
END

-- ============================================
-- 2. Kiểm tra kết quả
-- =====================================================
PRINT '';
PRINT '=== Danh sách Features Ăn ca & Suất ăn ===';
SELECT id, code, name, url, api_url, feature_type FROM feature_management 
WHERE code LIKE 'CANTEEN%'
ORDER BY code;

PRINT '';
PRINT '=== Script hoàn tất! ===';
PRINT '';
PRINT '=== Hướng dẫn gán quyền cho user/role ===';
PRINT '1. Vào module Quản lý phân quyền (Role Management)';
PRINT '2. Chọn role cần gán quyền (VD: Quản trị viên, Phó giám đốc,...)';
PRINT '3. Tick chọn các feature CANTEEN_* cần thiết';
PRINT '4. Lưu và reload ứng dụng';
