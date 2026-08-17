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
