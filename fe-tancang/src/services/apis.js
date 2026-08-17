// apis.js
import {
  APP_BASE,
  API_LOCAL_LOGIN,
} from "@EnvironmentFile/constants/urlConfig";
import axios from "axios";

const apis = axios.create({
  baseURL: APP_BASE || "http://192.168.0.65:3156",
  timeout: 10000,
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token_app") || localStorage.getItem("access_token") || ""}`,
  },
});

// Thêm interceptor để gắn token tự động
const isTokenExpired = (token) => {
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now; // hết hạn nếu exp < now
  } catch {
    return true; // token lỗi => coi như hết hạn
  }
};

// 🧠 Interceptor request: kiểm tra & gắn token
apis.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token_app") || localStorage.getItem("access_token");

    if (token) {
      if (isTokenExpired(token)) {
        logger.warn("⚠️ Token đã hết hạn, tiến hành logout...");
        // Xóa token ở client và điều hướng về trang login của FE
        localStorage.removeItem("token_app");
        localStorage.removeItem("access_token");
        // AuthProvider sẽ xử lý việc hiển thị trang đăng nhập
        window.location.href = "/login";
        return Promise.reject(new Error("Token expired"));
      }

      // Nếu token còn hạn thì gắn vào header
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🧩 Interceptor response: xử lý lỗi 401 từ BE
apis.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Kiểm tra nếu lỗi là 401 và không phải từ API đăng nhập local
    // Nếu là API_LOCAL_LOGIN, chúng ta muốn lỗi được xử lý ở LocalLoginForm
    if (
      error.response &&
      error.response.status === 401 &&
      error.config.url !== API_LOCAL_LOGIN
    ) {
      try {
        logger.warn("🚪 Nhận 401 từ server, tiến hành logout phía client...");
        // Xóa token ở client và điều hướng về trang login của FE
        localStorage.removeItem("token_app");
        localStorage.removeItem("access_token");
        // AuthProvider sẽ xử lý việc hiển thị trang đăng nhập
        window.location.href = "/login";
      } catch (logoutErr) {
        logger.error("Logout failed", logoutErr);
      }
    }
    return Promise.reject(error);
  }
);

export const callApi = async (method, url, data = {}, config = {}) => {
  try {
    const isFormData = data instanceof FormData;

    const response = await apis.request({
      ...config,
      method,
      url,
      // 🧠 Xử lý data và params cho các phương thức HTTP khác nhau
      ...(["get", "delete"].includes(method.toLowerCase())
        ? { params: { ...data, ...config.params } } // Gộp data và params cho GET, DELETE
        : { data }), // Sử dụng data làm body cho POST, PUT, PATCH
      headers: {
        ...(config.headers || {}),
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
      },
      timeout: config.timeout || 10000,
    });

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      error.response?.message ||
      "Lỗi không xác định";

    logger.error("❌ callApi error:", errorMessage);
    throw error;
  }
};

export const callApis = async (method, url, data = {}, config = {}) => {
  try {
    const response = await apis({ method, url, data, ...config });
    return response.data;
  } catch (error) {
    logger.log(error);
    throw error;
  }
};

export default apis;
