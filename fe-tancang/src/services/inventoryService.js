import { callApi } from "./api";
import {
  API_VPP_INVENTORY,
  API_VPP_INVENTORY_IMPORT,
  API_VPP_INVENTORY_EXPORT,
  API_VPP_INVENTORY_STATS,
  API_VPP_CATEGORIES,
  API_VPP_CATALOG_ITEMS
} from "@EnvironmentFile/constants/urlConfig";

/**
 * Lấy danh sách tồn kho VPP (Có phân trang và Filter)
 */
export const fetchInventoryList = async (params) => {
  try {
    const defaultParams = { page: 1, size: 20, ...params };
    const res = await callApi("get", API_VPP_INVENTORY, defaultParams);
    return res;
  } catch (error) {
    console.error("Error in fetchInventoryList:", error);
    throw error;
  }
};

/**
 * Lấy danh sách nhóm hàng (Category)
 */
export const fetchVPPCategories = async () => {
  try {
    const res = await callApi("get", API_VPP_CATEGORIES);
    return res;
  } catch (error) {
    console.error("Error in fetchVPPCategories:", error);
    throw error;
  }
};

/**
 * Thống kê Tổng quan (Mock cho tới khi có API BE)
 */
export const fetchInventoryStats = async () => {
  try {
    // Gọi API tương ứng khi BE cung cấp
    const res = await callApi("get", API_VPP_INVENTORY_STATS);
    return res;
  } catch (error) {
    console.error("Error in fetchInventoryStats:", error);
    // Fallback mock nếu API chưa có hoặc lỗi
    return {
      success: true,
      data: {
        totalItems: 0,
        totalValue: 0,
        enoughStock: 0,
        lowStock: 0,
        outOfStock: 0
      }
    };
  }
};

/**
 * Lấy Chi tiết mặt hàng + Lịch sử dòng (GET /api/v1/vpp/inventory/{productId})
 */
export const fetchInventoryDetail = async (productId, params) => {
  try {
    const res = await callApi("get", `${API_VPP_INVENTORY}/${productId}`, params);
    return res;
  } catch (error) {
    console.error("Error in fetchInventoryDetail:", error);
    throw error;
  }
};

/**
 * Đẩy phiếu Nhập kho mới
 */
export const importInventory = async (payload) => {
  try {
    const res = await callApi("post", API_VPP_INVENTORY_IMPORT, payload);
    return res;
  } catch (error) {
    console.error("Error in importInventory:", error);
    throw error;
  }
};

/**
 * Lấy danh sách Catalog cho Combobox chọn sản phẩm trong Popup (nhập kho)
 */
export const fetchCatalogItems = async (params) => {
  try {
    const defaultValue = { page: 1, limit: 100, status: 'active', ...params };
    const res = await callApi("get", API_VPP_CATALOG_ITEMS, defaultValue);
    return res;
  } catch (error) {
    console.error("Error in fetchCatalogItems:", error);
    throw error;
  }
};

/**
 * Báo BE xuất Excel file
 */
export const exportInventoryExcel = async (params) => {
  try {
    const response = await callApi("get", API_VPP_INVENTORY_EXPORT, params, {
      responseType: "blob", // Request blob for download
    });
    return response;
  } catch (error) {
    console.error("Error in exportInventoryExcel:", error);
    throw error;
  }
};
