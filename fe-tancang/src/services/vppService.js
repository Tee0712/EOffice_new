import { callApi } from "./api";
import {
  API_VPP_CATALOG,
  API_VPP_CATEGORIES,
  API_VPP_INVENTORY,
  API_VPP_INVENTORY_IMPORT,
  API_VPP_INVENTORY_EXPORT,
  API_VPP_PRODUCTS,
  API_VPP_PRODUCT_LIMITS,
  API_VPP_TRANSACTIONS,
  API_VPP_GOODS_ISSUES,
  API_VPP_GOODS_ISSUE_DETAIL,
  API_UPLOAD_FILE,
  API_VPP_REPORTS_SUMMARY,
  API_VPP_REPORTS_STOCK,
  API_VPP_REPORTS_DEPT,
  API_VPP_REPORTS_QUOTA,
  API_VPP_REPORTS_COST,
  API_VPP_REPORTS_EXPORT,
  API_VPP_DASHBOARD_KPI,
  API_VPP_DASHBOARD_CHART,
  API_VPP_GOODS_ISSUES_EXPORT,
  API_VPP_DISTRIBUTION_EXPORT,
  API_VPP_REQUEST_INFO,
  API_VPP_INVENTORY_PICKER,
  API_INFLOW_EXPECTED_USERS,
  API_APPROVAL_FLOW_CONFIG,
  API_GET_LIST_USER_BY_ORGANIZATION_UNIT,
  API_GET_LIST_UNIT,
} from "@EnvironmentFile/constants/urlConfig";

/**
 * MODULE 1: CATALOG MANAGEMENT
 */
export const getCatalogItems = (params) =>
  callApi("get", API_VPP_CATALOG, params);
export const getCategories = () => callApi("get", API_VPP_CATEGORIES);
export const createCatalogItem = (data) =>
  callApi("post", API_VPP_CATALOG, data);
export const updateCatalogItem = (id, data) =>
  callApi("post", `${API_VPP_CATALOG}/${id}`, data);
export const updateItemStatus = (id, status) =>
  callApi("put", `${API_VPP_CATALOG}/${id}/status`, { status });
export const deleteCatalogItem = (id) =>
  callApi("delete", `${API_VPP_CATALOG}/${id}`);
export const importCatalogExcel = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return callApi("post", `${API_VPP_CATALOG}/import`, formData);
};

/**
 * MODULE 2: INVENTORY MANAGEMENT
 */
export const getInventoryList = (params) =>
  callApi("get", API_VPP_INVENTORY, params);
export const getInventoryDetail = (productId, params) =>
  callApi("get", `${API_VPP_INVENTORY}/${productId}`, params);
export const importInventory = (payload) =>
  callApi("post", API_VPP_INVENTORY_IMPORT, payload);
export const exportInventory = (params) =>
  callApi("get", API_VPP_INVENTORY_EXPORT, params, { responseType: "blob" });

/**
 * MODULE 3 & 4: STATIONERY REQUESTS
 */
export const getProductsWithLimits = (params) =>
  callApi("get", API_VPP_PRODUCTS, params);
export const getInventoryPicker = (params) =>
  callApi("get", API_VPP_INVENTORY_PICKER, params);
export const getRequestorInfo = () => callApi("get", API_VPP_REQUEST_INFO);
export const checkProductLimits = (productIds) =>
  callApi("get", `${API_VPP_PRODUCT_LIMITS}/check`, {
    product_ids: productIds,
  });
export const createRequest = (payload) =>
  callApi("post", API_VPP_TRANSACTIONS, payload);
export const getRequests = (params) =>
  callApi("get", API_VPP_GOODS_ISSUES, params);
export const getRequestList = getRequests;
export const getRequestDetail = (id) =>
  callApi("get", `${API_VPP_GOODS_ISSUES}/${id}`);
export const deleteRequest = (id) =>
  callApi("delete", `${API_VPP_TRANSACTIONS}/${id}`);
export const resubmitRequest = (id, payload) =>
  callApi("patch", `${API_VPP_TRANSACTIONS}/${id}`, payload);
export const exportRequestList = (params) =>
  callApi("get", API_VPP_GOODS_ISSUES_EXPORT, params, { responseType: "blob" });

/**
 * MODULE 5: APPROVAL
 */
export const approveRequest = (id, payload) =>
  callApi("post", `${API_VPP_TRANSACTIONS}/${id}/approve`, payload);
export const rejectRequest = (id, payload) =>
  callApi("post", `${API_VPP_TRANSACTIONS}/${id}/reject`, payload);
export const escalateRequest = (id, payload) =>
  callApi("post", `${API_VPP_TRANSACTIONS}/${id}/escalate`, payload);
export const getExpectedApprovalFlow = (params) =>
  callApi("get", API_INFLOW_EXPECTED_USERS, params);
export const getApprovalFlowConfig = (params) =>
  callApi("get", API_APPROVAL_FLOW_CONFIG, params);
export const saveApprovalFlowConfig = (payload) =>
  callApi("post", API_APPROVAL_FLOW_CONFIG, payload);
export const getApprovalFlowModuleTypes = () =>
  callApi("get", `${API_APPROVAL_FLOW_CONFIG}/module-types`);
export const getUsersByOrganizationUnit = (params) =>
  callApi("get", API_GET_LIST_USER_BY_ORGANIZATION_UNIT, params);
export const getOrganizationUnits = () =>
  callApi("get", `${API_GET_LIST_UNIT}/all`);

/**
 * MODULE 6: DISTRIBUTION
 */
export const getDistributionQueue = (params) =>
  callApi("get", API_VPP_GOODS_ISSUES, params);
export const getDistributionDetail = (id) =>
  callApi("get", `${API_VPP_GOODS_ISSUES}/${id}`);
export const updateDistribution = (id, payload) =>
  callApi("patch", `${API_VPP_GOODS_ISSUES}/${id}`, payload);
export const exportDistributionQueue = (params) =>
  callApi("get", API_VPP_DISTRIBUTION_EXPORT, params, { responseType: "blob" });

/**
 * COMMON: FILE UPLOAD
 */
export const uploadVppImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return callApi("post", API_UPLOAD_FILE, formData);
};

// REPORT & DASHBOARD APIs
export const getReportSummary = (params) =>
  callApi("get", API_VPP_REPORTS_SUMMARY, params);
export const getStockMovementReport = (params) =>
  callApi("get", API_VPP_REPORTS_STOCK, params);
export const getByDepartmentReport = (params) =>
  callApi("get", API_VPP_REPORTS_DEPT, params);
export const getActualVsQuotaReport = (params) =>
  callApi("get", API_VPP_REPORTS_QUOTA, params);
export const getCostSummaryReport = (params) =>
  callApi("get", API_VPP_REPORTS_COST, params);
export const exportReportFile = (params) =>
  callApi("get", API_VPP_REPORTS_EXPORT, params, { responseType: "blob" });
export const getDashboardKPI = () => callApi("get", API_VPP_DASHBOARD_KPI);
export const getDashboardChart = (params) => callApi("get", API_VPP_DASHBOARD_CHART, params);
export const exportGoodsIssueReport = (params) => callApi("get", API_VPP_GOODS_ISSUES_EXPORT, params, { responseType: 'blob' });

export const getGoodsIssueDepartments = () => callApi('get', '/api/v1/vpp/goods-issues/departments');
