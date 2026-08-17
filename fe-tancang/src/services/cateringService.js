import { callApi } from './api';

const API_ROOT = '/api/v1/meals';

const cateringService = {
  /**
   * Fetch menus for date selection
   * @param {string} startDate YYYY-MM-DD
   * @param {string} endDate YYYY-MM-DD
   */
  getMenus: async (startDate, endDate) => {
    const response = await callApi('get', `${API_ROOT}/calendar?start_date=${startDate}&end_date=${endDate}`);
    return response?.data;
  },

  /**
   * Fetch all suppliers
   */
  getSuppliers: async () => {
    // Return items from the paginated response
    const response = await callApi('get', '/api/v1/suppliers');
    return response?.data?.items || [];
  },

  /**
   * Submit meal evaluation
   * @param {object} data Evaluation data
   */
  submitEvaluation: async (data) => {
    const response = await callApi('post', `${API_ROOT}/evaluations`, {
      data: {
        menu_id: data.menuId,
        supplier_id: data.supplierId,
        supplier_order_id: data.supplierOrderId,
        scores: data.scores,
        comment: data.comment,
        images: data.images,
      }
    });
    return response;
  }
};

export default cateringService;

