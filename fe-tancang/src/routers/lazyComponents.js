import { lazy } from "react";

// --- Pages ---
export const KanbanPage = lazy(() => import("@pages/DemoKanban"));
// export const KanbanPage = lazy(() => import("@pages/DemoKanban"));
export const Dynamic = lazy(() => import("@pages/DynamicForm/AddForm"));
export const ManagementMenu = lazy(() => import("@pages/ManagementMenu"));
export const ManagerUsers = lazy(() => import("@pages/ManagerUsers"));
export const AddProcess = lazy(() => import("@pages/BPMN/Component/AddProcess"));
export const EditProcess = lazy(() => import("@pages/BPMN/Component/EditProcess"));
export const DetailGroupUser = lazy(() => import("@pages/AdministrationSystem/DetailGroupUser"));
export const GroupUser = lazy(() => import("@pages/AdministrationSystem/GroupUser"));
export const NetworkAdministration = lazy(() => import("@pages/NetworkAdministration"));
export const SystemLogManagement = lazy(() => import("@pages/SystemLogManagement"));
export const NotificationsPage = lazy(() => import("@components/Notification"));
export const RoleManagement = lazy(() => import("@pages/AdministrationSystem/RoleManagement"));
export const ListUsers = lazy(() => import("@pages/ListUsers"));
export const DesignBPMN = lazy(() => import("@pages/BPMN/DesignBPMN"));
export const ListBPMN = lazy(() => import("@pages/BPMN/ListBPMN"));
export const ManagementUnit = lazy(() => import("@pages/Users"));
export const NotificationConfig = lazy(() => import("@pages/NotificationConfig"));
export const MobileAppVersionConfig = lazy(() => import("@pages/MobileAppVersionConfig"));
export const ViewUnitDetail = lazy(() => import("@pages/Users/components/ViewUnitDetail"));
export const ViewOR = lazy(() => import("@pages/ViewOR"));
export const CategoryManagement = lazy(() => import("@pages/CategoryManagement"));
export const RecordCategory = lazy(() => import("@pages/LookUpRecords"));
export const RecordCategoryDetail = lazy(() => import("@pages/LookUpRecords/components/RecordCategoryDetail"));
export const MeetingCalendar = lazy(() => import("@pages/MeetingCalendar"));
export const ExampleFiles = lazy(() => import("@pages/ExampleFiles"));

// --- Record Exploitation ---
export const CreateRecordExploitation = lazy(() => import("@pages/RecordExploitation/CreateRecordExploitation"));
export const EditRecordExploitation = lazy(() => import("@pages/RecordExploitation/EditRecordExploitation"));
export const ViewRecordExploitation = lazy(() => import("@pages/RecordExploitation/ViewRecordExploitation"));

// --- Layouts ---
export const MainLayout = lazy(() => import("@layouts/MainLayout"));

// --- Auth & System Pages ---
export const LoginCallback = lazy(() => import("@pages/Login/LoginCallback"));
export const LoginPage = lazy(() => import("../AuthContext/LoginPage"));
export const AuthConfigPage = lazy(() => import("../AuthContext/AuthConfigForm/AuthConfigPage"));
export const AuthCallback = lazy(() => import("../AuthContext/AuthConfigForm/AuthCallback"));
export const ThemeConfigPage = lazy(() => import("../pages/ThemeConfig"));
export const AccessDeniedPage = lazy(() => import("../pages/AccessDenied"));
export const UserProfile = lazy(() => import("@AuthContext/AuthConfigForm/UserProfile"));
export const DemoDriver = lazy(() => import("@pages/DemoDriver/DemoDriver"));
export const DemoSchedulerPage = lazy(() => import("@pages/DemoScheduler"));
export const Dashboard = lazy(() => import("@pages/Dashboard"));
export const GanttExample = lazy(() => import("@components/CustomGantt/GanttExample"));
export const CustomTableBorderCalendarTree = lazy(() => import("@components/CustomTableBorder/CustomTableBorderCalendarTree"));
export const StatisticsAndReports = lazy(() => import("@pages/StatisticsAndReports"));
export const CanteenManagement = lazy(() => import("@pages/Canteen/Management"));
export const CanteenCalendar = lazy(() => import("@pages/Canteen/CalendarPage"));
export const CanteenAdminDashboard = lazy(() => import("@pages/Canteen/AdminDashboard"));
export const CanteenCheckIn = lazy(() => import("@pages/Canteen/CheckIn/CheckIn"));
export const CanteenMenuManagement = lazy(() => import("@pages/Canteen/MenuManagement"));
export const CanteenMyRegistrations = lazy(() => import("@pages/Canteen/MyRegistrations"));
export const CanteenMealHistory = lazy(() => import("@pages/Canteen/MealRegistration/History"));
export const CanteenReconciliation = lazy(() => import("@pages/Canteen/Reconciliation/Reconciliation"));
export const CanteenSupplierManagement = lazy(() => import("@pages/Canteen/SupplierManagement/SupplierManagement"));
export const CanteenSystemSettings = lazy(() => import("@pages/Canteen/SystemSettings"));
export const BulletinList = lazy(() => import("@pages/BulletinManagement/BulletinList"));
export const BulletinApprovalWorkflow = lazy(() => import("@pages/BulletinManagement/ApprovalWorkflow"));
export const BulletinDepartmentManagement = lazy(() => import("@pages/BulletinManagement/DepartmentManagement"));
export const BulletinMemberManagement = lazy(() => import("@pages/BulletinManagement/MemberManagement"));
export const BulletinPermissionMatrix = lazy(() => import("@pages/BulletinManagement/PermissionMatrix"));
export const EventList = lazy(() => import("@pages/EventManagement/EventList"));
export const EventDetail = lazy(() => import("@pages/EventManagement/EventDetail"));
export const CreateEvent = lazy(() => import("@pages/EventManagement/CreateEvent"));
export const EventDashboard = lazy(() => import("@pages/EventManagement/EventDashboard"));
export const VehicleRegistration = lazy(() => import("@pages/VehicleRegistration"));

export const ApprovalFlowConfig = lazy(
  () => import("@pages/AdministrationSystem/ApprovalFlowConfig")
);
export const StationeryCategory = lazy(
  () => import("@pages/StationeryCategory")
);
export const InventoryManagement = lazy(
  () => import("@pages/InventoryManagement")
);
export const TaskDetailPage = lazy(
  () => import("@pages/WorkManagement/TaskDetailPage")
);
export const CreateOfficeRequest = lazy(
  () => import("@pages/OfficeSupplyRequest/CreateOfficeRequest")
);
export const ReviewOfficeRequest = lazy(
  () => import("@pages/OfficeSupplyRequest/ReviewOfficeRequest")
);
export const StationeryRequestDetail = lazy(
  () => import("@pages/StationeryRequestDetail")
);
export const StationeryDistribution = lazy(
  () => import("@pages/StationeryDistribution")
);
export const StationeryRequestList = lazy(
  () => import("@pages/OfficeSupplyRequest/RequestList")
);
export const StationeryReports = lazy(() => import("@pages/StationeryReports"));
export const DashboardASXH = lazy(() => import("@pages/DashboardASXH"));
export const ASXHManagement = lazy(() => import("@pages/ASXHManagement"));
export const ASXHRegistration = lazy(() => import("@pages/ASXHRegistration"));
export const ASXHWorkflowWizard = lazy(
  () => import("@pages/ASXHManagement/WorkflowWizard")
);
export const ASXHWorkflowManagement = lazy(
  () => import("@pages/ASXHManagement/WorkflowManagement")
);
export const ASXHWorkflowMapping = lazy(
  () => import("@pages/ASXHManagement/WorkflowManagement/MappingConfig")
);
export const ASXHDisbursement = lazy(
  () => import("@pages/ASXHManagement/Disbursement")
);
export const ASXHCreateDisbursement = lazy(
  () => import("@pages/ASXHManagement/CreateDisbursement")
);
export const ASXHProgramDetail = lazy(
  () => import("@pages/ASXHManagement/ProgramDetail")
);
export const ASXHEducationalSponsorship = lazy(
  () => import("@pages/ASXHManagement/EducationalSponsorship")
);
export const ASXHPartnerForm = lazy(
  () =>
    import("@pages/ASXHManagement/EducationalSponsorship/pages/PartnerFormPage")
);
export const ASXHPartnerList = lazy(
  () =>
    import("@pages/ASXHManagement/EducationalSponsorship/pages/PartnerListPage")
);
export const ASXHCandidateForm = lazy(
  () =>
    import("@pages/ASXHManagement/EducationalSponsorship/pages/CandidateFormPage")
);
export const VPPDashboard = lazy(() => import("../pages/VPP/Dashboard"));
export const VPPReports = lazy(() => import("../pages/VPP/Reports"));
export const MenuPage = lazy(
  () => import("@pages/Canteen/MenuManagement/MenuPage")
);
export const MealRegistrationPage = lazy(
  () => import("@pages/Canteen/MealRegistration")
);
export const MealRegistrationHistoryPage = lazy(
  () => import("@pages/Canteen/MealRegistration/History")
);
export const MealManagementPage = lazy(
  () => import("@pages/Canteen/Management")
);
export const CheckInPage = lazy(() => import("@pages/Canteen/CheckIn/CheckIn"));
export const ReconciliationPage = lazy(
  () => import("@pages/Canteen/Reconciliation/Reconciliation")
);
export const SupplierManagementPage = lazy(
  () => import("@pages/Canteen/SupplierManagement/SupplierManagement")
);
export const CanteenMyRegistrationsPage = lazy(
  () => import("@pages/Canteen/MyRegistrations")
);
export const CanteenCalendarPage = lazy(
  () => import("@pages/Canteen/CalendarPage")
);
export const CanteenMenuManagementPage = lazy(
  () => import("@pages/Canteen/MenuManagement")
);
export const CanteenSettingsPage = lazy(
  () => import("@pages/Canteen/SystemSettings.js")
);
export const CanteenAdminDashboardPage = lazy(
  () => import("@pages/Canteen/AdminDashboard")
);
export const ASXHAssetManagement = lazy(
  () => import("@pages/ASXHManagement/AssetManagement")
);
export const ASXHAddAsset = lazy(
  () => import("@pages/ASXHManagement/AssetManagement/AddAsset")
);
export const ASXHAssetEdit = lazy(
  () => import("@pages/ASXHManagement/AssetManagement/AssetEdit")
);
export const ASXHScheduleHandover = lazy(
  () => import("@pages/ASXHManagement/AssetManagement/ScheduleHandover")
);
export const BulletinDashboard = lazy(
  () => import("@pages/BulletinManagement/BulletinList")
);
export const BulletinDepartments = lazy(
  () => import("@pages/BulletinManagement/DepartmentManagement")
);
export const BulletinPermissions = lazy(
  () => import("@pages/BulletinManagement/PermissionMatrix")
);
export const BulletinMembers = lazy(
  () => import("@pages/BulletinManagement/MemberManagement")
);
export const BulletinWorkflow = lazy(
  () => import("@pages/BulletinManagement/ApprovalWorkflow")
);
export const AnnouncementsList = lazy(
  () => import("@pages/Announcements/Admin/AnnouncementsList")
);
export const AnnouncementWizard = lazy(
  () => import("@pages/Announcements/Admin/CreateAnnouncement/Wizard")
);
export const AnnouncementStatsDetail = lazy(
  () => import("@pages/Announcements/Admin/AnnouncementStatsDetail")
);
export const AnnouncementInbox = lazy(
  () => import("@pages/Announcements/User/Inbox")
);
export const AnnouncementDetail = lazy(
  () => import("@pages/Announcements/User/AnnouncementDetail")
);
export const BirthdayCBNVPage = lazy(() => import("@pages/BirthdayCBNV"));
export const EventNotificationInbox = lazy(
  () => import("@pages/EventManagement/NotificationInbox")
);
export const CreateEventNotification = lazy(
  () => import("@pages/EventManagement/CreateNotification")
);
export const EventGuestRegistration = lazy(
  () => import("@pages/EventManagement/GuestRegistration")
);
export const EventChecklistCreate = lazy(
  () => import("@pages/EventManagement/CreateChecklist")
);
export const EventInteractionStats = lazy(
  () => import("@pages/EventManagement/InteractionStats")
);
export const CateringSuppliers = lazy(
  () => import("@pages/CateringManagement/Suppliers")
);
export const CateringMealEvaluation = lazy(
  () => import("@pages/CateringManagement/MealEvaluation")
);
export const CateringDishBank = lazy(
  () => import("@pages/CateringManagement/DishBank")
);
export const CateringMenuSetup = lazy(
  () => import("@pages/CateringManagement/MenuSetup")
);
export const SupplierEvaluation = lazy(
  () => import("@pages/CateringManagement/SupplierEvaluation")
);
export const CateringSupplierDetail = lazy(
  () => import("@pages/CateringManagement/SupplierDetail")
);
export const MealFeedback = lazy(
  () => import("@pages/CateringManagement/MealFeedback")
);
export const MealFeedbackDetail = lazy(
  () => import("@pages/CateringManagement/MealFeedback/Detail")
);
export const CateringDashboard = lazy(
  () => import("@pages/CateringManagement/Dashboard")
);
export const CateringCheckIn = lazy(
  () => import("@pages/CateringManagement/CheckIn")
);
export const CateringReconciliation = lazy(
  () => import("@pages/CateringManagement/Reconciliation")
);
export const CateringSupplierSummaryDashboard = lazy(
  () => import("@pages/CateringManagement/SupplierSummaryDashboard")
);
export const CateringDailyMenuSetup = lazy(
  () => import("@pages/CateringManagement/DailyMenuSetup/index")
);
export const DocumentStatistics = lazy(() => import("@pages/DocumentStatistics"));
export const MMDashboard = lazy(() => import("@pages/MediaMonitoring/Dashboard"));
export const MMNewsSources = lazy(() => import("@pages/MediaMonitoring/NewsSources"));
export const MMKeywords = lazy(() => import("@pages/MediaMonitoring/Keywords"));
export const MMAlertRules = lazy(() => import("@pages/MediaMonitoring/AlertRules"));
export const MMArticles = lazy(() => import("@pages/MediaMonitoring/Articles"));
export const MMArticleDetail = lazy(() => import("@pages/MediaMonitoring/Articles/Detail"));
export const MMReportTemplates = lazy(() => import("@pages/MediaMonitoring/Reports"));
export const MMReportHistory = lazy(() => import("@pages/MediaMonitoring/Reports/History"));