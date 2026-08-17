import { callApi } from "./api";

const BASE_URL = "/api/v1/dashboard";

/**
 * Service quản lý các số liệu cho Dashboard An sinh Xã hội
 */
const dashboardAsxhService = {
  /**
   * @swagger
   * /api/v1/dashboard/summary:
   *   get:
   *     summary: Lấy thống kê tổng hợp (KPI Cards)
   *     tags: [Dashboard]
   *     parameters:
   *       - in: query
   *         name: year
   *         schema: { type: integer }
   *       - in: query
   *         name: quarter
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Thành công
   */
  getSummary: (params) => {
    return callApi("GET", `${BASE_URL}/summary`, params);
  },

  /**
   * @swagger
   * /api/v1/dashboard/disbursement-trend:
   *   get:
   *     summary: Lấy xu hướng giải ngân theo tháng
   *     tags: [Dashboard]
   *     parameters:
   *       - in: query
   *         name: year
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Thành công
   */
  getDisbursementTrend: (params) => {
    return callApi("GET", `${BASE_URL}/disbursement-trend`, params);
  },

  /**
   * @swagger
   * /api/v1/dashboard/funding-distribution:
   *   get:
   *     summary: Lấy phân bổ ngân sách theo loại hình tài trợ
   *     tags: [Dashboard]
   *     parameters:
   *       - in: query
   *         name: year
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Thành công
   */
  getFundingDistribution: (params) => {
    return callApi("GET", `${BASE_URL}/funding-distribution`, params);
  },

  /**
   * @swagger
   * /api/v1/dashboard/programs:
   *   get:
   *     summary: Lấy danh sách chương trình đang triển khai
   *     tags: [Dashboard]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer }
   *       - in: query
   *         name: page_size
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Thành công
   */
  getPrograms: (params) => {
    return callApi("GET", `${BASE_URL}/programs`, params);
  },

  /**
   * @swagger
   * /api/v1/dashboard/upcoming-events:
   *   get:
   *     summary: Lấy danh sách sự kiện sắp tới
   *     tags: [Dashboard]
   *     responses:
   *       200:
   *         description: Thành công
   */
  getUpcomingEvents: (params) => {
    return callApi("GET", `${BASE_URL}/upcoming-events`, params);
  },
  
  /**
   * @swagger
   * /api/v1/dashboard/locality-distribution:
   *   get:
   *     summary: Lấy phân bổ ngân sách theo khu vực (Top 5)
   *     tags: [Dashboard]
   *     responses:
   *       200:
   *         description: Thành công
   */
  getLocalityDistribution: (params) => {
    return callApi("GET", `${BASE_URL}/locality-distribution`, params);
  }
};

export default dashboardAsxhService;
