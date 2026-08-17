import { callApi } from "./api";

const BASE = "/api/v1/meals";
const ADMIN = "/api/v1/meals/admin";

export const mealBookingService = {
  // Employee APIs
  getCalendar: (startDate, endDate) =>
    callApi("get", `${BASE}/calendar`, {
      start_date: startDate,
      end_date: endDate,
    }),
  register: (data) => callApi("post", `${BASE}/bookings`, data),
  registerByDate: (data) => callApi("post", `${BASE}/bookings`, data),
  bulkRegister: (data) => callApi("post", `${BASE}/bulk-register`, data),
  bulkRegisterByFilters: (data) =>
    callApi("post", `${BASE}/bulk-register`, data),
  updateRegistration: (id, data) =>
    callApi("patch", `${BASE}/bookings/${id}`, data),
  cancelRegistration: (id, reason) =>
    callApi("patch", `${BASE}/bookings/${id}/cancel`, { reason }),
  getMyRegistrations: (params) =>
    callApi("get", `${BASE}/my`, params),
  getMyStats: (startDate, endDate) =>
    callApi("get", `${BASE}/my/stats`, {
      start_date: startDate,
      end_date: endDate,
    }),
  getMyRegistrationLogs: (params = {}) =>
    callApi("get", `${BASE}/my/logs`, params),
  getDepartments: () => callApi("get", "/api/v1/meals/departments"),
  getOrganizationUnits: (params = { page: 1, limit: 200 }) =>
    callApi("get", "/api/organization-units", params),
  getDishes: (params) => callApi("get", "/api/v1/dishes", params),
  getDailySummary: (date) =>
    callApi("get", `${ADMIN}/registrations/summary`, { date }),
  getDailyMenu: (date) => callApi("get", "/api/v1/menus/day", { date }),
  getDailyMenuDetail: (date) =>
    callApi("get", "/api/v1/menus/day-item", { date }),
  saveDailyMenuSetup: (data) =>
    callApi("post", "/api/v1/menus/day-setup", data),
  getAdminDashboard: (params = {}) =>
    callApi("get", `${ADMIN}/dashboard`, params),
  getAdminRegistrations: (params = {}) => {
    const payload = { ...params };
    if (payload.keyword && !payload.q) payload.q = payload.keyword;
    delete payload.keyword;
    return callApi("get", `${ADMIN}/registrations`, payload);
  },
  getAdminRegistrationLogs: (params = {}) =>
    callApi("get", `${ADMIN}/registration-logs`, params),
  registerMeal: (data) => callApi("post", "/api/v1/meals/bookings", data),
  getSupplierDashboardSummary: (params = {}) =>
    callApi("get", "/api/v1/meals/suppliers-dashboard/summary", params),
  getSupplierOrders: (id, params = {}) =>
    callApi("get", `/api/v1/suppliers/${id}/orders`, params),
  // Legacy settings APIs
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

// Legacy export for backward compatibility
export const canteenService = mealBookingService;
