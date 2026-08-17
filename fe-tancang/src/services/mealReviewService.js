import axios from "axios";
import { APP_BASE, API_CATERING_SUPPLIERS } from "@EnvironmentFile/constants/urlConfig";
import api, { callApi } from "./api";

const BASE_URL = "/api/v1";

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("token_app") || localStorage.getItem("access_token");

  return token ? { Authorization: `Bearer ${token}` } : {};
};

const safeGet = async (url, params, fallbackData) => {
  const response = await api.get(url, {
    params,
    validateStatus: (status) =>
      (status >= 200 && status < 300) || status === 404,
  });

  if (response.status === 404) {
    return {
      success: false,
      unavailable: true,
      data: fallbackData,
      meta: {},
      message: "Meal review API is not available on this backend.",
    };
  }

  return response.data;
};

const extractCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
};

export const mealReviewService = {
  getReviewCriteria: (params) =>
    safeGet(`${BASE_URL}/review-criteria`, params, []),

  getFilterOptions: () =>
    safeGet(`${BASE_URL}/meal-review-filters/options`, undefined, {
      departments: [],
    }),

  getMenus: async (params) => {
    const primary = await safeGet(`${BASE_URL}/menus`, params, []);
    const primaryData = primary?.data || [];

    if (primaryData.length > 0) return primary;

    if (!params?.status) return primary;

    const fallbackParams = { ...params };
    delete fallbackParams.status;

    return safeGet(`${BASE_URL}/menus`, fallbackParams, []);
  },

  getCateringSuppliers: async (params = {}) => {
    const query = { page: 0, size: 200, ...params };

    try {
      const response = await callApi("get", API_CATERING_SUPPLIERS, query);
      const suppliers = extractCollection(response);
      if (suppliers.length > 0) return { data: suppliers };
    } catch (error) {
      if (error?.response?.status && error.response.status !== 404) {
        throw error;
      }
    }

    const fallback = await safeGet("/api/v1/suppliers", query, []);
    return { data: extractCollection(fallback) };
  },

  getMenuDetail: (id) => safeGet(`${BASE_URL}/menus/${id}`, undefined, null),

  createReview: async (payload) => {
    const aliasPayload = {
      menu_id: payload?.menuId,
      supplier_id: payload?.supplierId,
      scores: {
        taste: payload?.tasteScore || 0,
        hygiene: payload?.hygieneScore || 0,
        portion: payload?.portionScore || 0,
        diversity: payload?.varietyScore || 0,
        service: payload?.serviceScore || 0,
      },
      comment: payload?.commentText || "",
      images: [],
    };

    try {
      // Backend canteen module uses /meal-reviews payload shape.
      return await callApi("post", `${BASE_URL}/meal-reviews`, payload);
    } catch (error) {
      // Keep legacy fallback for deployments that only expose /meals/evaluations.
      if (![400, 404].includes(error?.response?.status)) throw error;
      return callApi("post", `${BASE_URL}/meals/evaluations`, aliasPayload);
    }
  },

  getMyCurrentReview: (params) =>
    safeGet(`${BASE_URL}/meal-reviews/my-current`, params, {
      exists: false,
      review: null,
      images: [],
      replies: [],
    }),

  updateMyCurrentReview: (payload) =>
    callApi("put", `${BASE_URL}/meal-reviews/my-current`, payload),

  updateReview: (id, payload) =>
    callApi("put", `${BASE_URL}/meal-reviews/${id}`, payload),

  getReviews: (params) => safeGet(`${BASE_URL}/meal-reviews`, params, []),

  getReviewDetail: (id) =>
    safeGet(`${BASE_URL}/meal-reviews/${id}`, undefined, null),

  getReviewSummary: (params) =>
    safeGet(`${BASE_URL}/meal-reviews/summary`, params, null),

  getCriteriaAverages: (params) =>
    safeGet(`${BASE_URL}/meal-reviews/criteria-averages`, params, null),

  createReply: (reviewId, payload) =>
    callApi("post", `${BASE_URL}/meal-reviews/${reviewId}/replies`, payload),

  getReviewReplies: (reviewId) =>
    safeGet(`${BASE_URL}/meal-reviews/${reviewId}/replies`, undefined, []),

  uploadReviewImages: async (reviewId, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await axios.post(
      `${APP_BASE}${BASE_URL}/meal-reviews/${reviewId}/images`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },

  deleteReviewImage: (imageId) =>
    callApi("delete", `${BASE_URL}/meal-review-images/${imageId}`),

  exportExcel: async (params) => {
    const response = await axios.get(
      `${APP_BASE}${BASE_URL}/meal-reviews/export-excel`,
      {
        params,
        headers: getAuthHeaders(),
        responseType: "blob",
      }
    );

    return response;
  },

  getPrintReport: (params) =>
    callApi("get", `${BASE_URL}/meal-reviews/print-report`, params),
};

export default mealReviewService;
