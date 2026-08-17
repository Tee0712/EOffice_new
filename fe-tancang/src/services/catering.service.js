import axios from 'axios';
import { APP_BASE } from '../EnvironmentFile/constants/urlConfig';

const BASE_URL = `${APP_BASE}/api/v1`;

const getHeaders = () => {
  const token = localStorage.getItem('token'); // Hoặc lấy từ Redux/AuthContext
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const cateringService = {
  // SUMMARY KPI
  getSummary: async (date) => {
    const response = await axios.get(`${BASE_URL}/checkins/summary`, {
      params: { date },
      headers: getHeaders(),
    });
    return response.data;
  },

  // CHECK-IN LIST
  getCheckins: async (params) => {
    const response = await axios.get(`${BASE_URL}/checkins`, {
      params,
      headers: getHeaders(),
    });
    return response.data;
  },

  // SINGLE CHECK-IN
  confirmCheckin: async (payload) => {
    const response = await axios.post(`${BASE_URL}/checkins`, payload, {
      headers: getHeaders(),
    });
    return response.data;
  },

  // DELETE/UNDO CHECK-IN
  undoCheckin: async (id) => {
    const response = await axios.delete(`${BASE_URL}/checkins/${id}`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  // BULK CHECK-IN
  bulkCheckin: async (payload) => {
    const response = await axios.post(`${BASE_URL}/checkins/bulk`, payload, {
      headers: getHeaders(),
    });
    return response.data;
  },

  // WEEKLY MENU
  getWeeklyMenu: async (week_start) => {
    const response = await axios.get(`${BASE_URL}/menus/week`, {
      params: { week_start },
      headers: getHeaders(),
    });
    return response.data;
  },

  // DISH BANK
  getDishes: async (params) => {
    const response = await axios.get(`${BASE_URL}/dishes`, {
      params,
      headers: getHeaders(),
    });
    return response.data;
  },

  // SETTINGS
  getSettings: async (group) => {
    const response = await axios.get(`${BASE_URL}/settings`, {
      params: { group },
      headers: getHeaders(),
    });
    return response.data;
  }
};

export default cateringService;
