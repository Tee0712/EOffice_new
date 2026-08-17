import { APP_BASE } from '@EnvironmentFile/constants/urlConfig';
import axios from 'axios';
import { toast } from 'react-toastify';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || `${APP_BASE}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token_app');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response ? error.response.status : null;

    if (status === 401) {
      // Unauthorized: Clear token and redirect to login
      localStorage.removeItem('token_app');
      toast.error('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.');
      window.location.href = '/login';
    } else if (status === 403) {
      toast.error('Bạn không có quyền thực hiện thao tác này.');
    } else if (status === 422) {
      const message = error.response.data?.error?.message || 'Dữ liệu không hợp lệ.';
      toast.error(message);
    } else {
      toast.error(error.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
