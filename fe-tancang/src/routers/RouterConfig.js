import React, { Suspense, useEffect, lazy, useMemo } from "react";
import Loading from "@components/Loading/Loading";
import { People, ReceiptLong, Menu as MenuIcon, Restaurant, Campaign } from "@mui/icons-material";
import { Navigate, useRoutes, useLocation, useNavigate } from "react-router-dom";
import useDynamicMenuRoutes from "@hooks/useDynamicMenuRoutes";
import ProtectedRoute from "@AuthContext/ProtectedRoute";
import {
  ASXHAddAsset,
  ASXHAssetEdit,
  ASXHAssetManagement,
  ASXHCandidateForm,
  ASXHCreateDisbursement,
  ASXHDisbursement,
  ASXHEducationalSponsorship,
  ASXHManagement,
  ASXHPartnerForm,
  ASXHPartnerList,
  ASXHProgramDetail,
  ASXHRegistration,
  ASXHScheduleHandover,
  ASXHWorkflowManagement,
  ASXHWorkflowMapping,
  ASXHWorkflowWizard,
  AccessDeniedPage,
  AddProcess,
  AnnouncementDetail,
  AnnouncementInbox,
  AnnouncementStatsDetail,
  AnnouncementWizard,
  AnnouncementsList,
  ApprovalFlowConfig,
  AuthCallback,
  AuthConfigPage,
  BirthdayCBNVPage,
  BulletinApprovalWorkflow,
  BulletinDashboard,
  BulletinDepartmentManagement,
  BulletinDepartments,
  BulletinList,
  BulletinMemberManagement,
  BulletinMembers,
  BulletinPermissionMatrix,
  BulletinPermissions,
  BulletinWorkflow,
  CanteenAdminDashboard,
  CanteenAdminDashboardPage,
  CanteenCalendar,
  CanteenCalendarPage,
  CanteenCheckIn,
  CanteenManagement,
  CanteenMealHistory,
  CanteenMenuManagement,
  CanteenMenuManagementPage,
  CanteenMyRegistrations,
  CanteenMyRegistrationsPage,
  CanteenReconciliation,
  CanteenSettingsPage,
  CanteenSupplierManagement,
  CanteenSystemSettings,
  CategoryManagement,
  CateringCheckIn,
  CateringDailyMenuSetup,
  CateringDashboard,
  CateringDishBank,
  CateringMealEvaluation,
  CateringMenuSetup,
  CateringReconciliation,
  CateringSupplierDetail,
  CateringSupplierSummaryDashboard,
  CateringSuppliers,
  CheckInPage,
  CreateEvent,
  CreateEventNotification,
  CreateOfficeRequest,
  CreateRecordExploitation,
  CustomTableBorderCalendarTree,
  Dashboard,
  DashboardASXH,
  DemoDriver,
  DemoSchedulerPage,
  DesignBPMN,
  DetailGroupUser,
  DocumentStatistics,
  Dynamic,
  EditProcess,
  EditRecordExploitation,
  EventChecklistCreate,
  EventDashboard,
  EventDetail,
  EventGuestRegistration,
  EventInteractionStats,
  EventList,
  EventNotificationInbox,
  ExampleFiles,
  GanttExample,
  GroupUser,
  InventoryManagement,
  KanbanPage,
  ListBPMN,
  ListUsers,
  LoginCallback,
  LoginPage,
  MMAlertRules,
  MMArticleDetail,
  MMArticles,
  MMDashboard,
  MMKeywords,
  MMNewsSources,
  MMReportHistory,
  MMReportTemplates,
  MainLayout,
  ManagementMenu,
  ManagementUnit,
  ManagerUsers,
  MealFeedback,
  MealFeedbackDetail,
  MealManagementPage,
  MealRegistrationHistoryPage,
  MealRegistrationPage,
  MeetingCalendar,
  MenuPage,
  MobileAppVersionConfig,
  NetworkAdministration,
  NotificationConfig,
  NotificationsPage,
  ReconciliationPage,
  RecordCategory,
  RecordCategoryDetail,
  ReviewOfficeRequest,
  RoleManagement,
  StationeryCategory,
  StationeryDistribution,
  StationeryReports,
  StationeryRequestDetail,
  StationeryRequestList,
  StatisticsAndReports,
  SupplierEvaluation,
  SupplierManagementPage,
  SystemLogManagement,
  TaskDetailPage,
  ThemeConfigPage,
  UserProfile,
  VPPDashboard,
  VPPReports,
  VehicleRegistration,
  ViewOR,
  ViewRecordExploitation,
  ViewUnitDetail
} from "./lazyComponents"; // Keep imports for useRoutes

const CmsModuleLocal = lazy(() => import("@pages/AdministrationSystem/FunctionManagement/components/CmsModule/App"));
const DeepLinkHandler = lazy(() => import("@components/DeepLinkHandler"));

const CmsModuleWrapper = () => {
  const location = useLocation();
  return (
    <Suspense fallback={<Loading />}>
      <CmsModuleLocal initialPagePath={location.pathname} />
    </Suspense>
  );
};

 
 
export const routes = [
  {
    // title: "Quản trị hệ thống",
    title: "Quản lý phân quyền",
    icon: <People />,
    codeRouter: "quan-tri-he-thong",
    subItems: [
      {
        path: "/dashboard",
        element: <Dashboard />, // This is not lazy, so it's fine
        title: "Bảng thông tin",
        // codeRouter: "demo-kanban",
        codeRouter: "bang-thong-tin",
        hidden: true,
      },
      // {
      //   path: "/demo-kanban",  
      //   element: <KanbanPage />,
      //   // element: <KanbanDemo />,
      //   title: "Demo Kanban",
      //   // codeRouter: "demo-kanban",
      //   codeRouter: "thong-tin-cong-dan",
      // },
       {
        path: "/notifications",
        element: <NotificationsPage />, // Lazy component
        title: "Danh sách thông báo",
        // codeRouter: "demo-kanban",
        codeRouter: "danh-sach-thong-bao",
        hidden: true,
      },
      {
        path: "/notification-config",
        element: <NotificationConfig />,
        title: "Cấu hình thông báo",
        codeRouter: "cau-hinh-thong-bao",
        hidden: true,
      },

      {
        path: "/manage-unit",
        element: <ManagementUnit />, // Lazy component
        title: "Quản lý đơn vị",
        codeRouter: "quan-ly-don-vi",
      },

      {
        path: "/manage-list-users",
        element: <ListUsers />, // Lazy component
        title: "Quản lý người dùng",
        codeRouter: "quan-ly-nguoi-dung",
      },
      {
        path: "/list-group-user",
        element: <GroupUser />, // Lazy component
        title: "Quản lý nhóm người dùng",
        codeRouter: "quan-ly-nhom-nguoi-dung",
      },
      {
        path: "/meals",
        element: <CanteenManagement />,
        title: "Ăn ca & Suất ăn",
        codeRouter: "CANTEEN_LIST",
        icon: Restaurant,
      },
      {
        path: "/meals/calendar",
        element: <CanteenCalendar />,
        title: "Lịch đăng ký",
        codeRouter: "CANTEEN_CALENDAR",
      },
      {
        path: "/meals/my-registrations",
        element: <CanteenMyRegistrations />,
        title: "Đăng ký của tôi",
        codeRouter: "CANTEEN_MY_REG",
      },
      {
        path: "/meals/admin",
        element: <CanteenAdminDashboard />,
        title: "Dashboard Tổng hợp",
        codeRouter: "CANTEEN_ADMIN",
      },
      {
        path: "/meals/check-in",
        element: <CanteenCheckIn />,
        title: "Check-in Suất ăn",
        codeRouter: "CANTEEN_CHECKIN",
      },
      {
        path: "/meals/menus",
        element: <CanteenMenuManagement />,
        title: "Quản lý Menu",
        codeRouter: "CANTEEN_MENU",
      },
      {
        path: "/meals/reconciliation",
        element: <CanteenReconciliation />,
        title: "Đối soát suất ăn",
        codeRouter: "CANTEEN_RECONCILIATION",
      },
      {
        path: "/meals/suppliers",
        element: <CanteenSupplierManagement />,
        title: "Quản lý Nhà cung cấp",
        codeRouter: "CANTEEN_SUPPLIER",
      },
      {
        path: "/meals/history",
        element: <CanteenMealHistory />,
        title: "Lịch sử đăng ký",
        codeRouter: "CANTEEN_HISTORY",
      },
      {
        path: "/meals/settings",
        element: <CanteenSystemSettings />,
        title: "Cài đặt hệ thống",
        codeRouter: "CANTEEN_SETTINGS",
      },
      {
        path: "/vpp-reports",
        element: <VPPReports />,
        title: "Báo cáo",
        codeRouter: "bao-cao-vpp",
      },
      {
        path: "/vpp-dashboard",
        element: <VPPDashboard />,
        title: "Bảng tin",
        codeRouter: "bang-thong-tin-vpp",
      },
      {
        path: "/stationery-category",
        element: <StationeryCategory />,
        title: "Danh mục văn phòng phẩm",
        codeRouter: "danh-mục-van-phong-pham",
      },
      {
        path: "/inventory-management",
        element: <InventoryManagement />,
        title: "Quản lý tồn kho",
        codeRouter: "quan-ly-ton-kho-vpp",
      },
      {
        path: "/office-supply-request/list",
        element: <StationeryRequestList />,
        title: "Đề nghị cấp phát",
        codeRouter: "de-nghi-cap-vpp",
      },
      {
        path: "/office-supply-request/create",
        element: <CreateOfficeRequest />,
        title: "Tạo phiếu đề nghị",
        hidden: true,
      },
      {
        path: "/office-supply-request/review/:id",
        element: <ReviewOfficeRequest />,
        title: "Duyệt phiếu đề nghị",
        hidden: true,
      },
      {
        path: "/office-supply-request/detail/:id",
        element: <StationeryRequestDetail />,
        title: "Chi tiết phiếu đề nghị",
        hidden: true,
      },
      {
        path: "/stationery-distribution",
        element: <StationeryDistribution />,
        title: "Cấp phát",
        codeRouter: "cap-phat-vpp",
      },
      {
        path: "/admin/approval-flow-config",
        element: <ApprovalFlowConfig />,
        title: "Cấu hình luồng duyệt ",
        codeRouter: "cau-hinh-luong-duyet-vpp",
      },
      {
        path: "/bulletin/dashboard",
        element: <BulletinDashboard />,
        title: "Bảng tin & Thống kê",
        codeRouter: "bang-tin-thong-ke",
      },
      {
        path: "/bulletin/workflow",
        element: <BulletinWorkflow />,
        title: "Quy trình Phê duyệt",
        codeRouter: "quy-trinh-phe-duyet",
      },
      {
        path: "/bulletin/departments",
        element: <BulletinDepartments />,
        title: "Quản lý Phòng ban",
        codeRouter: "quan-ly-phong-ban-tin",
      },
      {
        path: "/bulletin/permissions",
        element: <BulletinPermissions />,
        title: "Ma trận Phân quyền",
        codeRouter: "ma-tran-phan-quyen-tin",
      },
      {
        path: "/bulletin/members",
        element: <BulletinMembers />,
        title: "Thành viên & Vai trò",
        codeRouter: "thanh-vien-vai-tro-tin",
      },
      {
        path: "/admin/announcements",
        element: <AnnouncementsList />,
        title: "Quản lý thông báo",
        codeRouter: "danh-sach-quan-ly-thong-bao",
      },
      {
        path: "/admin/announcements/create",
        element: <AnnouncementWizard />,
        title: "Tạo thông báo mới",
        codeRouter: "tao-thong-bao-moi",
        hidden: true,
      },
      {
        path: "/user/inbox",
        element: <AnnouncementInbox />,
        title: "Hộp thư của tôi",
        codeRouter: "hop-thu-thong-bao",
      },
      {
        path: "/admin/birthday-cbnv",
        element: <BirthdayCBNVPage />,
        title: "Sinh nhật CBCNV",
        codeRouter: "sinh-nhat-cbcnv",
      },
      {
        path: "/event-management/events",
        element: <EventList />,
        title: "Danh sách Sự kiện",
        codeRouter: "danh-sach-su-kien",
      },
      {
        path: "/event-management/events/create",
        element: <CreateEvent />,
        title: "Tạo Sự kiện mới",
        codeRouter: "tao-su-kien-moi",
        hidden: true,
      },
      {
        path: "/event-management/notifications/create",
        element: <CreateEventNotification />,
        title: "Gửi Thông báo Sự kiện",
        codeRouter: "gui-thong-bao-su-kien",
      },
      {
        path: "/event-management/guests/register",
        element: <EventGuestRegistration />,
        title: "Xác nhận & Đăng ký Khách mời",
        codeRouter: "xac-nhan-khach-moi",
      },
      {
        path: "/event-management/dashboard",
        element: <EventDashboard />,
        title: "Tổng hợp Xác nhận & Khách mời",
        codeRouter: "tong-hop-khach-moi",
      },
      {
        path: "/event-management/evaluation",
        element: <EventInteractionStats />,
        title: "Đánh giá Sự kiện",
        codeRouter: "danh-gia-su-kien-moi",
      },
      {
        path: "/event-management/events/:id",
        element: <EventDetail />,
        title: "Chi tiết Sự kiện",
        hidden: true,
      },
      {
        path: "/event-management/events/:id/checklist/create",
        element: <EventChecklistCreate />,
        title: "Tạo & Gán Checklist",
        hidden: true,
      },
      {
        path: "/event-management/events/:id/guests",
        element: <EventGuestRegistration />,
        title: "Đăng ký Khách mời",
        hidden: true,
      },
      {
        path: "/event-management/notifications",
        element: <EventNotificationInbox />,
        title: "Danh sách Thông báo",
        hidden: true,
      },
      {
        path: "/event-management/events/:id/notifications/create",
        element: <CreateEventNotification />,
        title: "Tạo Thông báo mới",
        hidden: true,
      },
      {
        path: "/canteen/admin/dashboard",
        element: <CanteenAdminDashboardPage />,
        title: "Dashboard tổng hợp suất ăn",
        codeRouter: "canteen-dashboard-tong-hop",
      },
      {
        path: "/canteen/admin/registrations",
        element: <MealManagementPage />,
        title: "Quản lý đăng ký suất ăn",
        codeRouter: "canteen-danh-sach-dang-ky",
        hidden: true,
      },
      {
        path: "/canteen/admin/menus",
        element: <CanteenMenuManagementPage />,
        title: "Quản lý Menu",
        codeRouter: "canteen-quan-ly-menu",
        hidden: true,
      },
      {
        path: "/canteen/admin/settings",
        element: <CanteenSettingsPage />,
        title: "Cài đặt đăng ký suất ăn",
        codeRouter: "canteen-cai-dat",
      },
      {
        path: "/catering/meal-evaluation",
        element: <CateringMealEvaluation />,
        title: "Đánh giá Bữa ăn",
        codeRouter: "danh-gia-bua-an",
        hidden: true,
      },
      {
        path: "/catering/supplier-summary-dashboard",
        element: <CateringSupplierSummaryDashboard />,
        title: "Dashboard tổng hợp nhà cung cấp",
        codeRouter: "canteen-dashboard-summary-ncc",
      },
      {
        path: "/catering/check-in",
        element: <CateringCheckIn />,
        title: "Check-in Suất ăn",
        codeRouter: "check-in-suat-an",
        hidden: true,
      },
      {
        path: "/catering/reconciliation",
        element: <CateringReconciliation />,
        title: "Đối chiếu suất ăn",
        codeRouter: "doi-chieu-suat-an",
        hidden: true,
      },
      {
        path: "/catering/suppliers",
        element: <CateringSuppliers />,
        title: "Quản lý nhà cung cấp",
        codeRouter: "quan-ly-nha-cung-cap-an-ca",
      },
      {
        path: "/catering/dashboard",
        element: <CateringDashboard />,
        title: "Bảng tin & Thống kê",
        codeRouter: "bang-tin-thong-ke-an-ca",
        hidden: true,
      },
      {
        path: "/catering/menu-setup",
        element: <CateringMenuSetup />,
        title: "Thiết lập thực đơn (Tuần)",
        codeRouter: "thiet-lap-menu-bep",
      },
      {
        path: "/catering/daily-menu-setup",
        element: <CateringDailyMenuSetup />,
        title: "Thiết lập thực đơn (Ngày)",
        codeRouter: "thiet-lap-menu-ngay",
        hidden: true,
      },
      {
        path: "/catering/supplier-detail/:id",
        element: <CateringSupplierDetail />,
        title: "Chi tiết nhà cung cấp",
      },
      {
        path: "/catering/dish-bank",
        element: <CateringDishBank />,
        title: "Ngân hàng món ăn",
        codeRouter: "ngan-hang-mon-an-an-ca",
        hidden: true,
      },
      {
        path: "/catering/supplier-evaluation",
        element: <SupplierEvaluation />,
        title: "Đánh giá nhà cung cấp",
        codeRouter: "danh-gia-nha-cung-cap",
        hidden: true,
      },
      {
        path: "/catering/meal-feedback",
        element: <MealFeedback />,
        title: "Gửi đánh giá bữa ăn",
        codeRouter: "gui-danh-gia-bua-an",
        hidden: true,
      },
      {
        path: "/catering/meal-feedback-detail",
        element: <MealFeedbackDetail />,
        title: "Chi tiết đánh giá theo bữa",
        codeRouter: "chi-tiet-danh-gia-theo-bua",
        hidden: true,
      },
      {
        path: "/statistics/documents",
        element: <DocumentStatistics />,
        title: "Thống kê văn bản",
        codeRouter: "thong-ke-van-ban-ca-nhan",
      },
      {
        path: "/media/dashboard",
        element: <MMDashboard />,
        title: "Dashboard Truyền thông",
        codeRouter: "dashboard-truyen-thong",
      },
      {
        path: "/media/articles",
        element: <MMArticles />,
        title: "Danh sách Tin tức",
        codeRouter: "danh-sach-tin-tuc-truyen-thong",
      },
      {
        path: "/media/articles/:id",
        element: <MMArticleDetail />,
        title: "Chi tiết Tin",
        hidden: true,
      },
      {
        path: "/media/news-sources",
        element: <MMNewsSources />,
        title: "Cấu hình Nguồn tin",
        codeRouter: "cau-hinh-nguon-tin",
      },
      {
        path: "/media/keywords",
        element: <MMKeywords />,
        title: "Cấu hình Từ khóa",
        codeRouter: "cau-hinh-tu-khoa",
      },
      {
        path: "/media/alert-rules",
        element: <MMAlertRules />,
        title: "Cảnh báo & Thông báo",
        codeRouter: "canh-bao-truyen-thong",
      },
      {
        path: "/media/reports",
        element: <MMReportTemplates />,
        title: "Báo cáo Định kỳ",
        codeRouter: "bao-cao-dinh-ky-truyen-thong",
      },
      {
        path: "/media/reports/history",
        element: <MMReportHistory />,
        title: "Lịch sử báo cáo",
        hidden: true,
      },
      {
        path: "/bulletins",
        element: <BulletinList />,
        title: "Quản lý bản tin",
        codeRouter: "quan-ly-ban-tin",
      },
      {
        path: "/bulletin-workflows",
        element: <BulletinApprovalWorkflow />,
        title: "Quy trình duyệt tin",
        codeRouter: "quy-trinh-duyet-tin",
      },
      {
        path: "/bulletin-departments",
        element: <BulletinDepartmentManagement />,
        title: "Phòng ban duyệt tin",
        codeRouter: "phong-ban-duyet-tin",
      },
      {
        path: "/bulletin-members",
        element: <BulletinMemberManagement />,
        title: "Thành viên ban biên tập",
        codeRouter: "thanh-vien-ban-bien-tap",
      },
      {
        path: "/bulletin-permissions",
        element: <BulletinPermissionMatrix />,
        title: "Ma trận phân quyền tin",
        codeRouter: "ma-tran-phan-quyen-tin",
      },
      {
        path: "/events",
        element: <EventList />,
        title: "Quản lý sự kiện",
        codeRouter: "quan-ly-su-kien",
      },
      {
        path: "/events/create",
        element: <CreateEvent />,
        title: "Tạo mới sự kiện",
        codeRouter: "tao-moi-su-kien",
      },
      {
        path: "/events/:id",
        element: <EventDetail />,
        title: "Chi tiết sự kiện",
        codeRouter: "chi-tiet-su-kien",
      },
      {
        path: "/events-dashboard",
        element: <EventDashboard />,
        title: "Tổng quan sự kiện",
        codeRouter: "tong-quan-su-kien",
      },
      {
        path: "/vehicle-registration",
        element: <VehicleRegistration />,
        title: "Đăng ký phương tiện",
        codeRouter: "dang-ky-phuong-tien",
      },
      // {
      //   path: "/demo-kanban",
      //   element: <KanbanPage />, // Lazy component
      //   // element: <KanbanDemo />, // Lazy component
      //   title: "demo banban",
      //   codeRouter: "demo-kanban",
      // },
      // {
      //   path: "/demo-gant",
      //   element: <GanttExample/>, // Lazy component
      //   title: "demo gant",
      //   codeRouter: "demo-gantt",
      // },
      // {
      //   path: "/demo-calender",
      //   element: <CustomTableBorderCalendarTree />, // Lazy component
      //   title: "demo calender",
      //   codeRouter: "demo-calender",
      // },
      // {
      //   path: "/demo-driver",
      //   element: <DemoDriver />, // Lazy component
      //   title: "demo driver",
      //   codeRouter: "demo-driver",
      // },
      // {
      //   path: "/demo-scheduler",
      //   element: <DemoSchedulerPage />, // Lazy component
      //   title: "Demo Scheduler",
      //   codeRouter: "demo-scheduler",
      // },
      // {
      //   path: "/network-log",
      //   element: <NetworkAdministration />, // Lazy component
      //   title: "Quản trị mạng",
      //   codeRouter: "quan-tri-mang",
      //   // hidden: true,
      // },
      {
        path: "/log-system-parameter",
        element: <SystemLogManagement />, // Lazy component
        // element: <RecordCategory />,
        // element: <MeetingCalendar />,
        title: "Quản lý nhật ký hệ thống",
        codeRouter: "quan-ly-nhat-ky-he-thong",
      },
        {
        path: "/category-management",
        element: <CategoryManagement />, // Lazy component
        title: "Quản lý danh mục",
        codeRouter: "quan-ly-danh-muc",
      },
      {
        path: "/manage-menu",
        element: <ManagementMenu />, // Lazy component
        icon: <MenuIcon />,
        // title: "Quản lý Menu",
        title: "Quản lý menu",
        codeRouter: "quan-ly-menu",
      },
      {
        path: "/example-files",
        element: <ExampleFiles />, // Lazy component
        title: "Quản lý file mẫu",
        codeRouter: "cau-hinh-file-mau",
        // codeRouter: "quan-ly-menu",
      },
      {
        path: "/mobile-app-version-config",
        element: <MobileAppVersionConfig />,
        title: "Quản lý phiên bản app mobile",
        codeRouter: "quan-ly-phien-ban-app-mobile",
      },
      {
        path: "/list-role",
        element: <RoleManagement />, // Lazy component
        title: "Quản lý vai trò",
        codeRouter: "quan-ly-vai-tro",
      },
      {
        path: "/manage-users/add",
        element: <ManagerUsers />, // Lazy component
        title: "Thêm mới người dùng",
        hidden: true,
      },
      {
        path: "/manage-unit_detail/:id",
        element: <ViewUnitDetail />, // Lazy component
        title: "Chi tiết đơn vị",
        hidden: true,
      },
      {
        path: "/View_QR/:id",
        element: <ViewOR />, // Lazy component
        title: "viewQr",
        hidden: true,
      },
      {
        path: "/manage-users/:id",
        element: <ManagerUsers />,
        title: "Cập nhật người dùng",
        hidden: true,
      },
      {
        path: "/manage-users-detail/:id",
        element: <ManagerUsers />, // Lazy component
        title: "Chi tiết người dùng",
        hidden: true,
      },
      {
        path: "/info-personal/:id",
        element: <ManagerUsers />, // Lazy component
        title: "Thông tin cá nhân",
        hidden: true,
      },
      {
        path: "/manage-user/:id",
        element: <ManagerUsers />, // Lazy component
        title: "Chi tiết người dùng",
        hidden: true,
      },
      {
        hidden: true,
        path: "/look-up-records",
        element: <RecordCategory />,
        title: "Tra cứu hồ sơ",
        codeRouter: "tra-cuu-ho-so",
      },
      {
        path: "/look-up-records/:id",
        element: <RecordCategoryDetail />,
        title: "Chi tiết bộ danh mục",
        hidden: true, // Ẩn khỏi menu chính
      },
      //  {
      //   path: "/manage-group-user/:id",
      //   element: <DetailGroupUser />,
      //   title: "Chi tiết nhóm người dùng",
      // },
      // {
      //   path: "/manage-group-user/:id",
      //   element: <DetailGroupUser />,
      //   title: "Chi tiết nhóm người dùng",
      // },
    ],
  },

  // {
  //   path: "/gantt",
  //   element: <StatisticsAndReports/>,
  //   title: "Gantt",
  //   codeRouter: "gantt",
  // },

  {
    title: "Truyền thông",
    icon: <Campaign />,
    codeRouter: "truyen-thong",
    subItems: [
      {
        title: "An sinh xã hội",
        codeRouter: "an-sinh-xa-hoi",
        subItems: [
          {
            path: "/dashboard-asxh",
            element: <DashboardASXH />,
            title: "Dashboard ASXH",
            codeRouter: "dashboard-asxh",
          },
          {
            path: "/asxh-management",
            element: <ASXHManagement />,
            title: "Quản lý Chương trình",
            codeRouter: "quan-ly-chuong-trinh-asxh",
          },
          {
            path: "/asxh/workflow-management",
            element: <ASXHWorkflowManagement />,
            title: "Quản lý luồng xử lý",
            codeRouter: "quan-ly-luong-asxh",
          },
          {
            path: "/asxh/workflow-mapping",
            element: <ASXHWorkflowMapping />,
            title: "Thiết lập luồng Module",
            codeRouter: "thiet-lap-luong-asxh-mapping",
            hidden: true,
          },
          {
            path: "/asxh/workflow-wizard/:processKey?",
            element: <ASXHWorkflowWizard />,
            title: "Cấu hình luồng xử lý",
            codeRouter: "cau-hinh-luong-asxh-wizard",
            hidden: true,
          },
          {
            path: "/asxh/educational-sponsorship",
            element: <ASXHEducationalSponsorship />,
            title: "Tài trợ giáo dục & học bổng",
            codeRouter: "tai-tro-giao-duc-hoc-bong",
          },
          {
            path: "/asxh-registration",
            element: <ASXHRegistration />,
            title: "Đăng ký Chương trình",
            codeRouter: "dang-ky-chuong-trinh-asxh",
            hidden: true,
          },
          {
            path: "/asxh-registration/edit/:id",
            element: <ASXHRegistration />,
            title: "Chỉnh sửa Chương trình",
            hidden: true,
          },
          {
            path: "/asxh/programs/:programId/disbursement",
            element: <ASXHDisbursement />,
            title: "Chi tiết Giải ngân & Biên bản",
            hidden: true,
          },
          {
            path: "/asxh/programs/:programId/disbursement/create",
            element: <ASXHCreateDisbursement />,
            title: "Tạo đợt giải ngân mới",
            codeRouter: "tao-moi-giai-ngan-asxh",
            hidden: true,
          },
          {
            path: "/asxh/programs/:programId/disbursement/edit/:disbursementId",
            element: <ASXHCreateDisbursement />,
            title: "Chỉnh sửa đợt giải ngân",
            hidden: true,
          },
          {
            path: "/asxh/programs/:programId/assets",
            element: <ASXHAssetManagement />,
            title: "Quản lý Hiện vật",
            codeRouter: "quan-ly-hien-vat-asxh",
            hidden: true,
          },
          {
            path: "/asxh/programs/:programId",
            element: <ASXHProgramDetail />,
            title: "Chi tiết Chương trình",
            hidden: true,
          },
          {
            path: "/asxh/educational-sponsorship/partner/add",
            element: <ASXHPartnerForm />,
            title: "Thêm Trường đối tác",
            hidden: true,
          },
          {
            path: "/asxh/educational-sponsorship/partner/edit/:id",
            element: <ASXHPartnerForm />,
            title: "Chỉnh sửa Trường đối tác",
            hidden: true,
          },
          {
            path: "/asxh/educational-sponsorship/partners",
            element: <ASXHPartnerList />,
            title: "Danh sách Trường đối tác",
            hidden: true,
          },
          {
            path: "/asxh/educational-sponsorship/candidate/add",
            element: <ASXHCandidateForm />,
            title: "Thêm Ứng viên",
            hidden: true,
          },
          {
            path: "/asxh/educational-sponsorship/candidate/edit/:id",
            element: <ASXHCandidateForm />,
            title: "Chỉnh sửa Ứng viên",
            hidden: true,
          },
          {
            path: "/asxh/programs/:programId/assets/add",
            element: <ASXHAddAsset />,
            title: "Thêm Hạng mục Hiện vật",
            hidden: true,
          },
          {
            path: "/asxh/programs/:programId/assets/:assetId/edit",
            element: <ASXHAssetEdit />,
            title: "Chỉnh sửa Hạng mục Hiện vật",
            hidden: true,
          },
          {
            path: "/asxh/programs/:programId/assets/schedule-handover",
            element: <ASXHScheduleHandover />,
            title: "Lên lịch Bàn giao Hiện vật",
            hidden: true,
          },
          {
            path: "/asxh/programs/:programId/assets/schedule-handover/:id",
            element: <ASXHScheduleHandover />,
            title: "Chỉnh sửa Lên lịch Bàn giao Hiện vật",
            hidden: true,
          },
        ],
      },
    ],
  },

  {
    // title: "Quản lý quy trình",
    title: "QUẢN LÝ QUY TRÌNH",
    icon: <ReceiptLong />,
    codeRouter: "quan-ly-quy-trinh",
    subItems: [
      // {
      //   path: "/design-bpmn",
      //   element: <DesignBPMN />,
      //   title: "Thêm mới quy trình",
      // },
      {
        path: "/design-bpmn/:id",
        element: <DesignBPMN />, // Lazy component
        title: "Cập nhật quy trình",
        hidden: true,
      },
      {
        path: "/list-bpmn",
        element: <ListBPMN />, // Lazy component
        title: "Danh sách biểu mẫu quy trình",
        codeRouter: "danh-sach-bieu-mau-quy-trinh",
      },
      {
        path: "/list-bpmn/add",
        element: <AddProcess />, // Lazy component
        title: "Thêm mới quy trình",
        hidden: true,
      },
      {
        path: "/list-bpmn/:id",
        element: <EditProcess />, // Lazy component
        title: "Cập nhật quy trình",
        hidden: true,
      },
    ],
  },

  //   {
  //   title: "HỒ SƠ LƯU TRỮ",
  //   icon: <People />,
  //   codeRouter: "ho-so-luu-tru",
  //   subItems: [
  //     {
  //       path: "/look-up-records",
  //       element: <RecordCategory />, 
  //       title: "Tra cứu hồ sơ",
  //       codeRouter: "tra-cuu-ho-so",
  //     },
  //   ]
  // },
  // {
  //   // title: "Quản trị hệ thống",
  //   title: "VĂN BẢN ĐIỀU HÀNH",
  //   icon: <People />,
  //   codeRouter: "van-ban-dieu-hanh",
  // 	subItems: [
  // 		{
  // 			path: "/incoming-text",
  // 			element: <IncomingDocumentManagement />,
  // 			title: "Văn bản đến",
  // 			codeRouter: "van-ban-den",
  // 			subItems: [
  // 				// {
  // 				// 	path: "/incoming-text/requesting-opinion",
  // 				// 	element: <ConsultationDocs />,
  // 				// 	title: "Văn bản xin ý kiến",
  // 				// 	codeRouter: "van-ban-xin-y-kien",
  // 				// 	badge: 144,
  // 				// },
  // 				// {
  // 				// 	path: "/incoming-text/received-to-know",
  // 				// 	element: <IncomingDocumentManagement />,
  // 				// 	title: "Văn bản nhận để biết",
  // 				// 	codeRouter: "van-ban-nhan-de-biet",
  // 				// 	badge: 31,
  // 				// },
  // 				// {
  // 				// 	path: "/incoming-text/unit-documents",
  // 				// 	element: <IncomingDocumentManagement />,
  // 				// 	title: "Văn bản của đơn vị",
  // 				// 	codeRouter: "van-ban-cua-don-vi",
  // 				// 	badge: 43,
  // 				// },
  // 			],
  // 		},

  //     {
  //       path: "/text-management-way",
  //       element: <QualificationManagement />,
  //       title: "Văn bản đi",
  //       codeRouter: "van-ban-di",
  //     },
  //     {
  //       path: "/signing-submission/view/:id",
  //       element: <SigningSubmissionDetail />,
  //       title: "Chi tiết trình ký",
  //       hidden: true,
  //     },
  //   ]},

  // {
  //   path: "/dynamic-form",
  //   title: "Quản lý biểu mẫu",
  //   icon: <InboxIcon />,
  //   element: <DynamicForm />,
  // },
  {
    path: "/dynamic-form/add",
    title: "Thêm mới biểu mẫu", // Lazy component
    element: <Dynamic />, 
    hidden: true,
  },
  {
    path: "/dynamic-form/:id",
    title: "Cập nhật biểu mẫu",
    element: <Dynamic />, // Lazy component
    hidden: true,
  },


  {
    // Đăng ký các route cứng của CmsModule để React Router không chặn
    path: "/libary",
    element: <CmsModuleWrapper />,
    hidden: true
  },
  {
    path: "/album",
    element: <CmsModuleWrapper />,
    hidden: true
  },
  {
    path: "/album/:id",
    element: <CmsModuleWrapper />,
    hidden: true
  },
  {
    path: "/video",
    element: <CmsModuleWrapper />,
    hidden: true
  },
  {
    path: "/video/:id",
    element: <CmsModuleWrapper />,
    hidden: true
  },
  {
    path: "/tin-tuc",
    element: <CmsModuleWrapper />,
    hidden: true
  },
  {
    path: "/news/:id",
    element: <CmsModuleWrapper />,
    hidden: true
  },
  {
    path: "/search",
    element: <CmsModuleWrapper />,
    hidden: true
  },
  {
    path: "/topic/:slug",
    element: <CmsModuleWrapper />,
    hidden: true
  },
  {
    path: "/calendar",
    element: <CmsModuleWrapper />,
    hidden: true
  },
];

// Hàm tìm đường dẫn đầu tiên từ menu
const findFirstRoute = (routesToSearch) => {
  if (!Array.isArray(routesToSearch) || routesToSearch.length === 0)
    return null;

  const isValidPath = (p) =>
    typeof p === "string" &&
    p.startsWith("/") &&
    !p.includes(":") &&
    !p.includes("*");

  for (const route of routesToSearch) {
    // Nếu là route có path, không hidden và path tĩnh thì chọn
    if (route.path && !route.hidden && isValidPath(route.path)) {
      return route.path;
    }

    // Nếu có subItems thì tìm tiếp trong subItems
    if (route.subItems && route.subItems.length > 0) {
      const firstSubPath = findFirstRoute(route.subItems);
      if (firstSubPath) return firstSubPath;
    }
  }

  return null;
};

const CatchAllRedirect = () => {
  const location = useLocation();
  const normalizedPathname = location.pathname.replace(/\/{2,}/g, "/");

  if (normalizedPathname !== location.pathname) {
    return (
      <Navigate
        to={{
          pathname: normalizedPathname,
          search: location.search,
          hash: location.hash,
        }}
        replace
      />
    );
  }

  if (location.pathname !== "/" && location.pathname !== "/login") {
    sessionStorage.setItem(
      "savedRedirectLink",
      location.pathname + location.search + location.hash
    );
  }
  return <Navigate to="/" replace />;
};

let alreadyRestored = false;

const RouterConfig = () => {
  //   useEffect(() => {
  //     const fetchDhvbData = async () => {
  //       const token =
  //         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjIzNDZhYTlkYTRkNTMwZjYxYmJiZWZkIiwiaWF0IjoxNzYyMzExNzc4LCJleHAiOjE3NzQzMTE3Nzh9.uzJKY8kM43qj-yDzrWWiqnKpmdshNFIZBohHMGHEAr4";
  //       const headers = {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": "application/json",
  //       };

  //       const requests = [
  //         callApi("get", API_VIEWCONFIG_DHVB, { headers }),
  //         callApi("get", API_CRMSTATUS_DHVB, { headers }),
  //         callApi("get", API_CRMSOURCE_DHVB, { headers }),
  //       ];

  //       try {
  //         const [viewConfigRes, crmStatusRes, crmSourceRes] =
  //           await Promise.all(requests);

  //      if (viewConfigRes) {
  //   localStorage.setItem("viewConfig_dhvb", JSON.stringify(viewConfigRes));
  // }

  // if (crmStatusRes) {
  //   localStorage.setItem("crmStatus", JSON.stringify(crmStatusRes));
  // }

  // if (crmSourceRes) {
  //   localStorage.setItem("crmSource", JSON.stringify(crmSourceRes));
  // }

  //       } catch (error) {
  //         logger.error("Error fetching DHVB data:", error);
  //         // Optionally, show a toast message to the user
  //       }
  //     };

  //     // Chỉ gọi API nếu chưa có dữ liệu trong localStorage
  //     if (!localStorage.getItem('viewConfig_dhvb') || !localStorage.getItem('crmStatus') || !localStorage.getItem('crmSource')) {
  //       fetchDhvbData();
  //     }
  //   }, []);

  const dynamicMenuRoutes = useDynamicMenuRoutes();

  const combinedRoutes = [...routes, ...dynamicMenuRoutes];

  // Chỉ lấy route đầu tiên từ menu động để đồng bộ với thanh menu.
  const defaultRedirectPath = findFirstRoute(dynamicMenuRoutes);

  const navigate = useNavigate();

  useEffect(() => {
    const savedLink = sessionStorage.getItem("savedRedirectLink");
    if (savedLink && dynamicMenuRoutes.length > 0 && !alreadyRestored) {
      sessionStorage.removeItem("savedRedirectLink");
      alreadyRestored = true;
      setTimeout(() => {
        navigate(savedLink, { replace: true });
      }, 100);
    }
  }, [dynamicMenuRoutes, navigate]);

  const flattenRoutes = (routesToFlatten) => {
    let flatRoutes = [];
    if (!routesToFlatten || !Array.isArray(routesToFlatten)) return flatRoutes;
    for (const route of routesToFlatten) {
      if (!route) continue;
      if (route.path && route.element) {
        flatRoutes.push({
          path: route.path,
          element: <Suspense fallback={<Loading />}>{route.element}</Suspense>,
        });
      }

      if (route.subItems && route.subItems.length > 0) {
        flatRoutes.push(...flattenRoutes(route.subItems));
      }
    }
    return flatRoutes;
  };

  // const firstPath = findFirstAvailableRoute(combinedRoutes);

  return useRoutes([
    {
      path: "/login",
      element: (
        <Suspense fallback={<Loading />}>
          <LoginPage />
        </Suspense>
      ),
    },
    {
      path: "/login/callback",
      element: (
        <Suspense fallback={<Loading />}>
          <LoginCallback />
        </Suspense>
      ),
    },
    {
      path: "/auth/callback",
      element: (
        <Suspense fallback={<Loading />}>
          <AuthCallback />
        </Suspense>
      ),
    },
    {
      path: "/access-denied",
      element: (
        <Suspense fallback={<Loading />}>
          <AccessDeniedPage />
        </Suspense>
      ),
    },
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <Suspense fallback={<Loading />}>
            <MainLayout menuRoutes={combinedRoutes} />
          </Suspense>
        </ProtectedRoute>
      ),
      children: [
        // Điều hướng từ "/" đến route đầu tiên đang hiển thị trên menu.
        {
          index: true,
          element: defaultRedirectPath ? (
            <Navigate to={defaultRedirectPath} replace />
          ) : (
            <Loading />
          ),
        },
        ...flattenRoutes(combinedRoutes.filter((route) => route && route.path !== "/" && route.path !== "/user-profile")),
        // Thêm route cho trang cấu hình xác thực
        {
          path: "/admin/auth-config",
          element: (
            <Suspense fallback={<Loading />}>
              <AuthConfigPage />
            </Suspense>
          ),
        },
        // Thêm route cho trang cấu hình giao diện
        {
          path: "/admin/theme-config",
          element: (
            <Suspense fallback={<Loading />}>
              <ThemeConfigPage />
            </Suspense>
          ),
        },
        // Thêm route cho trang Dịch vụ lưu trữ
        // {
        //   path: "/admin/storage-service",
        //   element: (
        //     <Suspense fallback={<Loading />}>
        //       <StorageConfig />
        //     </Suspense>
        //   ),
        // },
        {
          path: "/:deeplinkKey/:deeplinkId",
          element: (
            <Suspense fallback={<Loading />}>
              <DeepLinkHandler />
            </Suspense>
          ),
        },
      {
          path: "/user/announcements/:id",
          element: (
            <Suspense fallback={<Loading />}>
              <AnnouncementDetail />
            </Suspense>
          ),
        },
      {
          path: "/admin/announcements/:id/stats",
          element: (
            <Suspense fallback={<Loading />}>
              <AnnouncementStatsDetail />
            </Suspense>
          ),
        },
      {
          path: "/task/detail/:id",
          element: (
            <Suspense fallback={<Loading />}>
              <TaskDetailPage />
            </Suspense>
          ),
        }
      ],
    },
    {
      path: "*",
      element: <CatchAllRedirect />,
    },
  ]);
};

export default RouterConfig;
