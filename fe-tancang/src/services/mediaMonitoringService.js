import { callApi } from "./api";

const BASE_URL = "/api/media";

const mediaMonitoringService = {
  // --- News Sources ---
  getNewsSources: (params = {}) => callApi("get", `${BASE_URL}/news-sources`, params),
  getNewsSourceStats: () => callApi("get", `${BASE_URL}/news-sources/stats`),
  getNewsSourceById: (id) => callApi("get", `${BASE_URL}/news-sources/${id}`),
  createNewsSource: (data) => callApi("post", `${BASE_URL}/news-sources`, data),
  updateNewsSource: (id, data) => callApi("patch", `${BASE_URL}/news-sources/${id}`, data),
  deleteNewsSource: (id) => callApi("delete", `${BASE_URL}/news-sources/${id}`),
  toggleNewsSource: (id, isEnabled) => callApi("patch", `${BASE_URL}/news-sources/${id}/toggle`, { isEnabled }),
  syncAllNewsSources: () => callApi("post", `${BASE_URL}/news-sources/sync-all`),

  // --- Keywords ---
  getKeywords: (params = {}) => callApi("get", `${BASE_URL}/keywords`, params),
  getKeywordById: (id) => callApi("get", `${BASE_URL}/keywords/${id}`),
  getMatchedArticles: (id) => callApi("get", `${BASE_URL}/keywords/${id}/matched-articles`),
  createKeyword: (data) => callApi("post", `${BASE_URL}/keywords`, data),
  updateKeyword: (id, data) => callApi("patch", `${BASE_URL}/keywords/${id}`, data),
  deleteKeyword: (id) => callApi("delete", `${BASE_URL}/keywords/${id}`),
  toggleKeyword: (id, isActive) => callApi("patch", `${BASE_URL}/keywords/${id}/toggle`, { isActive }),
  reorderKeywords: (data) => callApi("patch", `${BASE_URL}/keywords/reorder`, data),

  // --- Articles & Processing ---
  getArticles: (params = {}) => callApi("get", `${BASE_URL}/articles`, params),
  getArticleStats: () => callApi("get", `${BASE_URL}/articles/stats`),
  getArticleById: (id) => callApi("get", `${BASE_URL}/articles/${id}`),
  getArticleNeighbors: (id) => callApi("get", `${BASE_URL}/articles/${id}/neighbors`),
  updateArticleStatus: (id, status) => callApi("patch", `${BASE_URL}/articles/${id}/status`, { status }),
  batchUpdateArticleStatus: (data) => callApi("patch", `${BASE_URL}/articles/batch-status`, data),

  getArticleProcessing: (id) => callApi("get", `${BASE_URL}/articles/${id}/processing`),
  upsertArticleProcessing: (id, data) => callApi("post", `${BASE_URL}/articles/${id}/processing`, data),
  forwardArticle: (id, data) => callApi("post", `${BASE_URL}/articles/${id}/forward`, data),
  escalateArticle: (id) => callApi("post", `${BASE_URL}/articles/${id}/escalate`),
  markArticleProcessed: (id) => callApi("patch", `${BASE_URL}/articles/${id}/mark-processing`),

  // --- Alert Rules ---
  getAlertRules: (params = {}) => callApi("get", `${BASE_URL}/alert-rules`, params),
  getAlertEvents: (params = {}) => callApi("get", `${BASE_URL}/alert-rules/events`, params),
  getAlertRuleById: (id) => callApi("get", `${BASE_URL}/alert-rules/${id}`),
  createAlertRule: (data) => callApi("post", `${BASE_URL}/alert-rules`, data),
  updateAlertRule: (id, data) => callApi("patch", `${BASE_URL}/alert-rules/${id}`, data),
  deleteAlertRule: (id) => callApi("delete", `${BASE_URL}/alert-rules/${id}`),
  toggleAlertRule: (id, isActive) => callApi("patch", `${BASE_URL}/alert-rules/${id}/toggle`, { isActive }),
  resolveAlertEvent: (eventId) => callApi("patch", `${BASE_URL}/alert-rules/events/${eventId}/resolve`),

  // --- Dashboard ---
  getDashboardKpi: (params = {}) => callApi("get", `${BASE_URL}/dashboard/kpi`, params),
  getDashboardTrend: (params = {}) => callApi("get", `${BASE_URL}/dashboard/trend`, params),
  getDashboardSentiment: (params = {}) => callApi("get", `${BASE_URL}/dashboard/sentiment`, params),
  getDashboardTopSources: (params = {}) => callApi("get", `${BASE_URL}/dashboard/top-sources`, params),
  getDashboardHeatmap: (params = {}) => callApi("get", `${BASE_URL}/dashboard/heatmap`, params),
  getDashboardKeywordCloud: (params = {}) => callApi("get", `${BASE_URL}/dashboard/keyword-cloud`, params),
  getDashboardSourceTypes: (params = {}) => callApi("get", `${BASE_URL}/dashboard/source-types`, params),
  getDashboardRecentAlerts: () => callApi("get", `${BASE_URL}/dashboard/recent-alerts`),
  getDashboardActivity: () => callApi("get", `${BASE_URL}/dashboard/activity`),

  // --- Report Templates ---
  getReports: (params = {}) => callApi("get", `${BASE_URL}/reports`, params),
  getReportHistory: (params = {}) => callApi("get", `${BASE_URL}/reports/history`, params),
  getReportById: (id) => callApi("get", `${BASE_URL}/reports/${id}`),
  createReport: (data) => callApi("post", `${BASE_URL}/reports`, data),
  updateReport: (id, data) => callApi("patch", `${BASE_URL}/reports/${id}`, data),
  deleteReport: (id) => callApi("delete", `${BASE_URL}/reports/${id}`),
  duplicateReport: (id) => callApi("post", `${BASE_URL}/reports/${id}/duplicate`),
  sendReport: (id) => callApi("post", `${BASE_URL}/reports/${id}/send`),
  resendReportHistory: (historyId) => callApi("post", `${BASE_URL}/reports/history/${historyId}/resend`),
};

export default mediaMonitoringService;
