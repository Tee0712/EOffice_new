-- =====================================================
-- Seed Script: Thêm menu "Ăn ca & Suất ăn" vào hệ thống
-- Chạy trong SQL Server Management Studio (SSMS)
-- =====================================================

USE [EOFFICE];

-- ============================================
-- 1. Kiểm tra và thêm Parent Menu (Nhóm menu chính)
-- =====================================================
DECLARE @ParentId NVARCHAR(100) = NEWID();
DECLARE @ParentCode NVARCHAR(255) = 'an-ca-suat-an';

-- Xóa menu cũ nếu tồn tại
DELETE FROM menu_managers WHERE code = @ParentCode;

-- Thêm menu cha
INSERT INTO menu_managers (
    _id,
    code,
    name,
    icon,
    function,
    path,
    parent,
    status,
    hidden,
    "order",
    roleGroupIds,
    createdAt,
    updatedAt
) VALUES (
    @ParentId,
    @ParentCode,
    N'Ăn ca & Suất ăn',
    N'<i data-v-4b3e0c2a="" class="fa-solid fa-utensils"></i>',
    NULL,
    NULL,
    NULL,
    1,
    1,
    35, -- Vị trí trong sidebar (sau Đăng ký xe)
    NULL,
    GETDATE(),
    GETDATE()
);

PRINT '✓ Đã thêm menu cha: Ăn ca & Suất ăn';

-- ============================================
-- 2. Thêm các menu con
-- =====================================================

DECLARE @Menus TABLE (
    code NVARCHAR(255),
    name NVARCHAR(500),
    path NVARCHAR(500),
    icon NVARCHAR(500),
    fnCode NVARCHAR(255)
);

INSERT INTO @Menus VALUES
    (N'quan-ly-suat-an', N'Quản lý suất ăn', N'/canteen', N'fa-utensils', N'CANTEEN_LIST'),
    (N'lich-dang-ky', N'Lịch đăng ký', N'/canteen/calendar', N'fa-calendar', N'CANTEEN_CALENDAR'),
    (N'dang-ky-cua-toi', N'Đăng ký của tôi', N'/canteen/my-registrations', N'fa-clipboard-list', N'CANTEEN_MY_REG'),
    (N'dashboard-suat-an', N'Dashboard Tổng hợp', N'/canteen/admin', N'fa-chart-line', N'CANTEEN_ADMIN'),
    (N'check-in-suat-an', N'Check-in Suất ăn', N'/canteen/check-in', N'fa-qrcode', N'CANTEEN_CHECKIN'),
    (N'quan-ly-menu-suat-an', N'Quản lý Menu', N'/canteen/menus', N'fa-book-open', N'CANTEEN_MENU'),
    (N'doi-soat-suat-an', N'Đối soát suất ăn', N'/canteen/reconciliation', N'fa-balance-scale', N'CANTEEN_RECONCILIATION'),
    (N'quan-ly-nha-cung-cap', N'Quản lý Nhà cung cấp', N'/canteen/suppliers', N'fa-truck', N'CANTEEN_SUPPLIER'),
    (N'lich-su-dang-ky', N'Lịch sử đăng ký', N'/canteen/history', N'fa-history', N'CANTEEN_HISTORY'),
    (N'cai-dat-suat-an', N'Cài đặt hệ thống', N'/canteen/settings', N'fa-cog', N'CANTEEN_SETTINGS');

DECLARE @Code NVARCHAR(255), @Name NVARCHAR(500), @Path NVARCHAR(500), @Icon NVARCHAR(500), @FnCode NVARCHAR(255);

WHILE EXISTS (SELECT 1 FROM @Menus)
BEGIN
    SELECT TOP 1 @Code = code, @Name = name, @Path = path, @Icon = icon, @FnCode = fnCode FROM @Menus;
    
    -- Xóa menu cũ nếu tồn tại
    DELETE FROM menu_managers WHERE code = @Code;
    
    -- Thêm menu con
    INSERT INTO menu_managers (
        _id,
        code,
        name,
        icon,
        function,
        path,
        parent,
        status,
        hidden,
        "order",
        roleGroupIds,
        createdAt,
        updatedAt
    ) VALUES (
        NEWID(),
        @Code,
        @Name,
        @Icon,
        @FnCode,
        @Path,
        @ParentId,
        1,
        1,
        0,
        NULL,
        GETDATE(),
        GETDATE()
    );
    
    PRINT '✓ Đã thêm menu: ' + @Name + ' (' + @Path + ')';
    
    DELETE FROM @Menus WHERE code = @Code;
END

-- ============================================
-- 3. Kiểm tra kết quả
-- =====================================================
PRINT '';
PRINT '=== Danh sách menu Ăn ca & Suất ăn ===';
SELECT code, name, path, function, parent FROM menu_managers 
WHERE parent = @ParentId OR code = @ParentCode
ORDER BY "order";

PRINT '';
PRINT '=== Script hoàn tất! ===';
PRINT 'Lưu ý: Menu chỉ hiển thị khi user có quyền trong feature_management';
