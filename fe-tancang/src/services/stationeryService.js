import { APP_BASE } from "@EnvironmentFile/constants/urlConfig";
import { callApi } from "./api";

const BASE_URL = `${APP_BASE}/api/v1/vpp`;

// 1. Tra cứu danh mục VPP
export const getStationeryList = (params) => {
  return callApi("get", `${BASE_URL}/catalog-items`, params);
};

// 2. Lấy chi tiết VPP theo ID
export const getStationeryItemById = (id) => {
  return callApi("get", `${BASE_URL}/catalog-items/${id}`);
};

// 3. Danh sách nhóm hàng (tham chiếu)
export const getCategories = () => {
  return callApi("get", `${BASE_URL}/categories`);
};

// 3. Tạo mặt hàng VPP
export const createStationeryItem = (data) => {
  return callApi("post", `${BASE_URL}/catalog-items`, data);
};

// 4. Sửa mặt hàng VPP
export const updateStationeryItem = (id, data) => {
  return callApi("patch", `${BASE_URL}/catalog-items/${id}`, data);
};

// 5. Ẩn / Hiện mặt hàng VPP (Soft Delete)
export const updateStationeryStatus = (id, status) => {
  return callApi("put", `${BASE_URL}/catalog-items/${id}/status`, { status });
};

// 6. Xóa mặt hàng VPP
export const deleteStationeryItem = (id) => {
  return callApi("delete", `${BASE_URL}/catalog-items/${id}`);
};

// 7. Import danh mục VPP từ Excel
export const importCatalogItems = (formData) => {
  return callApi("post", `${BASE_URL}/catalog-items/import`, formData);
};


