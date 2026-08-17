import { callApi } from "./api";

const BASE = "/api/v1/canteen";
const ADMIN = "/api/v1/canteen/admin";

export const canteenService = {
  // Employee APIs
  getCalendar: (startDate, endDate) =>
    callApi("get", `${BASE}/calendar`, {
      start_date: startDate,
      end_date: endDate,
    }),
  register: (data) => callApi("post", `${BASE}/register`, data),
  registerByDate: (data) => callApi("post", `${BASE}/register`, data),
  bulkRegister: (data) => callApi("post", `${BASE}/bulk-register`, data),
  bulkRegisterByFilters: (data) =>
    callApi("post", `${BASE}/bulk-register`, data),
  updateRegistration: (id, data) =>
    callApi("patch", `${BASE}/registrations/${id}`, data),
  cancelRegistration: (id, reason) =>
    callApi("patch", `${BASE}/registrations/${id}/cancel`, { reason }),
  getMyRegistrations: (params) =>
    callApi("get", `${BASE}/my-registrations`, params),
  getMyStats: (startDate, endDate) =>
    callApi("get", `${BASE}/my-stats`, {
      start_date: startDate,
      end_date: endDate,
    }),
  getMyRegistrationLogs: (params = {}) =>
    callApi("get", `${BASE}/my-registration-logs`, params),
  getDepartments: () => callApi("get", "/api/v1/canteen/departments"),
  getOrganizationUnits: (params = { page: 1, limit: 200 }) =>
    callApi("get", "/api/organization-units", params),
  getDishes: (params) => callApi("get", "/api/v1/dishes", params),
  getDailySummary: (date) =>
    callApi("get", "/api/v1/canteen/admin/registrations/summary", { date }),
  getDailyMenu: (date) => callApi("get", "/api/v1/menus/day", { date }),
  getDailyMenuDetail: (date) =>
    callApi("get", "/api/v1/menus/day-item", { date }),
  saveDailyMenuSetup: (data) =>
    callApi("post", "/api/v1/menus/day-setup", data),
  getAdminDashboard: (params = {}) =>
    callApi("get", "/api/v1/canteen/admin/dashboard", params),
  getAdminRegistrations: (params = {}) => {
    const payload = { ...params };
    if (payload.keyword && !payload.q) payload.q = payload.keyword;
    delete payload.keyword;
    return callApi("get", "/api/v1/canteen/admin/registrations", payload);
  },
  getAdminRegistrationLogs: (params = {}) =>
    callApi("get", "/api/v1/canteen/admin/registration-logs", params),
  registerMeal: (data) => callApi("post", "/api/v1/registrations", data),
  getSupplierDashboardSummary: (params = {}) =>
    callApi("get", "/api/v1/canteen/suppliers-dashboard/summary", params),
  getSupplierOrders: (id, params = {}) =>
    callApi("get", `/api/v1/suppliers/${id}/orders`, params),
  // Legacy settings APIs (used by /canteen/admin/settings current page)
  getSettings: () => callApi("get", "/api/v1/meal-settings"),
  updateSettings: (data) => callApi("post", "/api/v1/meal-settings/bulk", data),

  // Admin APIs
  getSessions: () => callApi("get", `${ADMIN}/sessions`),
  createSession: (data) => callApi("post", `${ADMIN}/sessions`, data),
  updateSession: (id, data) => callApi("put", `${ADMIN}/sessions/${id}`, data),
  deleteSession: (id) => callApi("delete", `${ADMIN}/sessions/${id}`),

  getMenus: (params) => callApi("get", `${ADMIN}/menus`, params),
  createMenu: (data) => callApi("post", `${ADMIN}/menus`, data),
  updateMenu: (id, data) => callApi("put", `${ADMIN}/menus/${id}`, data),
  toggleMenu: (id) => callApi("patch", `${ADMIN}/menus/${id}/toggle`),
  deleteMenu: (id) => callApi("delete", `${ADMIN}/menus/${id}`),

  getTemplates: () => callApi("get", `${ADMIN}/templates`),
  createTemplate: (data) => callApi("post", `${ADMIN}/templates`, data),
  deleteTemplate: (id) => callApi("delete", `${ADMIN}/templates/${id}`),

  getSystemSettings: (params = {}) =>
    callApi("get", `${ADMIN}/settings`, params),
  updateSystemSettings: (data) => callApi("patch", `${ADMIN}/settings`, data),
  syncDatabase: (params = {}) =>
    callApi("get", "/api/v1/menus/sync-db", params),

  getUserSettings: () => callApi("get", `${ADMIN}/user-settings`),
  updateUserSettings: (data) =>
    callApi("patch", `${ADMIN}/user-settings`, data),
  getUserManagementList: (params = { page: 1, limit: 100 }) =>
    callApi("get", "/api/users", params),
  getUserManagementListLimit: (params = { page: 1, limit: 100 }) =>
    callApi("get", "/api/users/limit", params),
  getDailyMenuPrintData: (date) =>
    callApi("get", "/api/v1/menus/daily-print-data", { date }),
  exportDailyMenuExcel: (date) =>
    callApi(
      "get",
      "/api/v1/menus/daily-export-excel",
      { date },
      { responseType: "blob" }
    ),
  getDepartmentSummary: (date) =>
    callApi("get", "/api/v1/registrations/department-summary", { date }),
};
