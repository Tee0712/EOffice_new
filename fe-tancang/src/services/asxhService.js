import { callApi } from "./api";

const API_PROGRAMS = "/api/v1/programs";

/**
 * Service quản lý các chương trình An sinh Xã hội (ASXH)
 */
const asxhService = {
  /**
   * Lấy danh sách chương trình ASXH với phân trang và lọc
   * @param {object} params - Tham số lọc (page, page_size, keyword, funding_type, status, locality, year)
   */
  getPrograms: (params) => {
    return callApi("GET", API_PROGRAMS, params);
  },

  /**
   * Xuất báo cáo Excel danh sách chương trình
   * @param {object} params - Tham số lọc
   */
  exportPrograms: (params) => {
    return callApi("GET", `${API_PROGRAMS}/export`, params, {
      responseType: "blob",
    });
  },

  /**
   * Tạo mới một chương trình ASXH
   * @param {object} data - Dữ liệu chương trình mới
   */
  createProgram: (data) => {
    return callApi("POST", API_PROGRAMS, data);
  },

  /**
   * Lấy chi tiết một chương trình ASXH
   * @param {string|number} id - ID chương trình
   */
  getProgramDetail: (id) => {
    return callApi("GET", `${API_PROGRAMS}/${id}`);
  },

  /**
   * Cập nhật một chương trình ASXH
   * @param {string|number} id - ID chương trình
   * @param {object} data - Dữ liệu chương trình chỉnh sửa
   */
  updateProgram: (id, data) => {
    return callApi("PUT", `${API_PROGRAMS}/${id}`, data);
  },

  /**
   * Lấy dữ liệu khởi tạo cho màn hình Tạo đợt giải ngân mới
   * @param {string|number} programId - ID chương trình
   */
  getNewDisbursementContext: (programId) => {
    return callApi("GET", `${API_PROGRAMS}/${programId}/disbursements/new-context`);
  },

  /**
   * Preview mã đợt giải ngân tiếp theo
   * @param {string|number} programId - ID chương trình
   */
  getNextDisbursementCode: (programId) => {
    return callApi("GET", `${API_PROGRAMS}/${programId}/disbursements/next-code`);
  },

  /**
   * Lấy danh sách đơn vị nhận tiền
   * @param {object} params - { keyword, page, limit }
   */
  getReceivers: (params) => {
    return callApi("GET", "/api/v1/disbursement-receivers", null, params);
  },

  /**
   * Tạo mới một đơn vị nhận tiền master
   * @param {object} data - { name, tax_code, bank_name, bank_account_number, bank_branch, bank_account_holder }
   */
  createReceiver: (data) => {
    return callApi("POST", "/api/v1/disbursement-receivers", data);
  },

  /**
   * Kiểm tra ngân sách realtime cho một hạng mục
   * @param {string|number} itemId - ID hạng mục (program_items.id)
   * @param {object} data - { current_disbursement_id, details: [{ amount }] }
   */
  checkBudget: (itemId, data) => {
    return callApi("POST", `/api/v1/program-items/${itemId}/disbursements/budget-check`, data);
  },

  /**
   * Lấy danh sách đợt giải ngân của một chương trình (Overview)
   */
  getDisbursementOverview: (programId, params) => {
    return callApi("GET", `${API_PROGRAMS}/${programId}/disbursements/overview`, params);
  },

  /**
   * Xuất excel danh sách đợt giải ngân của chương trình
   * @param {string|number} programId - ID chương trình
   * @param {object} params - Tham số lọc
   */
  exportDisbursements: (programId, params) => {
    return callApi("GET", `${API_PROGRAMS}/${programId}/disbursements/export`, params, {
      responseType: "blob",
    });
  },

  /**
   * Lấy timeline lịch sử giải ngân theo chương trình
   */
  getDisbursementTimeline: (programId, params) => {
    return callApi("GET", `${API_PROGRAMS}/${programId}/disbursements/timeline`, params);
  },

  /**
   * Lấy chi tiết một đợt giải ngân
   */
  getDisbursementIdDetail: (id) => {
    return callApi("GET", `/api/v1/disbursements/${id}`);
  },

  /**
   * Tạo đợt giải ngân mới (Lưu nháp lần đầu)
   * @param {string|number} programId - ID chương trình
   * @param {object} data - Dữ liệu đợt giải ngân
   */
  createDisbursementBatch: (programId, data) => {
    return callApi("POST", `${API_PROGRAMS}/${programId}/disbursements`, data);
  },

  /**
   * Cập nhật đợt giải ngân (Chỉ khi ở trạng thái DRAFT)
   */
  updateDisbursementBatch: (disbursementId, data) => {
    return callApi("PUT", `/api/v1/disbursements/${disbursementId}`, data);
  },

  /**
   * Lưu nháp đợt giải ngân (Finalize draft status + log)
   */
  saveDisbursementDraft: (disbursementId) => {
    return callApi("POST", `/api/v1/disbursements/${disbursementId}/save-draft`);
  },

  /**
   * Cập nhật trạng thái đợt giải ngân
   */
  updateDisbursementStatus: (id, status) => {
    return callApi("POST", `/api/v1/disbursements/${id}/status`, { status });
  },

  /**
   * Xác nhận và gửi phê duyệt đợt giải ngân (Deprecated - Dùng updateDisbursementStatus)
   */
  submitDisbursementApproval: (disbursementId, data) => {
    return callApi("POST", `/api/v1/disbursements/${disbursementId}/confirm-submit`, data);
  },

  /**
   * Hủy bỏ đợt giải ngân (Xóa nháp)
   */
  deleteDisbursementBatch: (disbursementId) => {
    return callApi("DELETE", `/api/v1/disbursements/${disbursementId}`);
  },

  /**
   * Upload chứng từ cho đợt giải ngân
   */
  uploadDisbursementAttachment: (disbursementId, formData) => {
    return callApi("POST", `/api/v1/disbursements/${disbursementId}/attachments`, formData);
  },

  /**
   * Phân loại loại chứng từ
   */
  classifyDisbursementAttachment: (attachmentId, docType) => {
    return callApi("PATCH", `/api/v1/disbursement-attachments/${attachmentId}/classify`, { doc_type: docType });
  },

  /**
   * Xoá file đính kèm đợt giải ngân
   */
  deleteDisbursementAttachment: (disbursementId, attachmentId) => {
    return callApi("DELETE", `/api/v1/disbursements/${disbursementId}/attachments/${attachmentId}`);
  },

  /**
   * Tải/Xem chứng từ
   */
  downloadDisbursementAttachment: (attachmentId) => {
    return callApi("GET", `/api/v1/disbursement-attachments/${attachmentId}/download`, null, {
      responseType: "blob",
    });
  },
  /**
   * Xoá chương trình (Dùng để rollback khi bị lỗi transaction ở FE)
   * @param {string|number} programId - ID chương trình
   */
  deleteProgram: (programId) => {
    return callApi("DELETE", `${API_PROGRAMS}/${programId}`);
  },

  /**
   * Sinh mã chương trình tự động
   * @param {string} fundingType - CASH | INKIND | EDUCATION
   */
  getAssets: (programId, params) => {
    return callApi("GET", `/api/v1/programs/${programId}/in-kind/assets`, null, { params });
  },

  exportAssets: (programId) => {
    return callApi("GET", `/api/v1/programs/${programId}/in-kind/assets/export`, null, {
      responseType: "blob",
    });
  },

  createAsset: (programId, formData) => {
    return callApi("POST", `${API_PROGRAMS}/${programId}/assets`, formData);
  },

  getAssetStatuses: () => {
    return callApi("GET", "/api/v1/assets/statuses");
  },

  getAssetDetail: (assetId) => {
    return callApi("GET", `/api/v1/assets/${assetId}`);
  },

  updateAsset: (assetId, data) => {
    return callApi("PUT", `/api/v1/assets/${assetId}`, data);
  },

  deleteAsset: (assetId) => {
    return callApi("DELETE", `/api/v1/assets/${assetId}`);
  },

  addAssetSpecification: (assetId, data) => {
    return callApi("POST", `/api/v1/assets/${assetId}/specifications`, data);
  },
  deleteAssetSpecification: (specId) => {
    return callApi("DELETE", `/api/v1/assets/specifications/${specId}`);
  },

  uploadAssetAttachment: (assetId, formData) => {
    return callApi("POST", `/api/v1/assets/${assetId}/attachments`, formData);
  },
  deleteAssetAttachment: (attachmentId) => {
    return callApi("DELETE", `/api/v1/assets/attachments/${attachmentId}`);
  },

  getHandoverEvents: (programId) => {
    return callApi("GET", `${API_PROGRAMS}/${programId}/in-kind/handover-events`);
  },

  linkAssetHandover: (assetId, handoverAssetId) => {
    return callApi("PATCH", `/api/v1/assets/${assetId}/handover`, { handover_asset_id: handoverAssetId });
  },

  generateProgramCode: (fundingType) => {
    return callApi("GET", `${API_PROGRAMS}/generate-code`, null, { funding_type: fundingType });
  },

  /**
   * Quản lý bàn giao hiện vật (Handover)
   */
  getInKindOverview: (programId) => {
    return callApi("GET", `${API_PROGRAMS}/${programId}/in-kind/overview`);
  },

  getHandoverBatches: (programId) => {
    return callApi("GET", `${API_PROGRAMS}/${programId}/handover-assets`);
  },

  getHandoverNewContext: (programId, params) => {
    return callApi("GET", `${API_PROGRAMS}/${programId}/handover-assets/new-context`, params);
  },

  getSuppliers: (params) => {
    return callApi("GET", "/api/v1/suppliers", null, params);
  },
  getSupplierDetail: (id) => {
    return callApi("GET", `/api/v1/suppliers/${id}`);
  },
  createSupplier: (data) => {
    return callApi("POST", "/api/v1/suppliers", data);
  },
  updateSupplier: (id, data) => {
    return callApi("PUT", `/api/v1/suppliers/${id}`, data);
  },
  deleteSupplier: (id) => {
    return callApi("DELETE", `/api/v1/suppliers/${id}`);
  },

  getSupplierSummary: (programId) => {
    return callApi("GET", `${API_PROGRAMS}/${programId}/suppliers/summary`);
  },

  createHandoverBatch: (programId, data) => {
    return callApi("POST", `${API_PROGRAMS}/${programId}/handover-assets`, data);
  },

  getHandoverDetail: (id) => {
    return callApi("GET", `/api/v1/handover-assets/${id}`);
  },

  updateHandoverBatch: (id, data) => {
    return callApi("PUT", `/api/v1/handover-assets/${id}`, data);
  },

  deleteHandoverBatch: (id) => {
    return callApi("DELETE", `/api/v1/handover-assets/${id}`);
  },
  saveHandoverDraft: (id, data) => {
    return callApi("POST", `/api/v1/handover-assets/${id}/save-draft`, data);
  },
  updateHandoverStatus: (id, status) => {
    return callApi("PATCH", `/api/v1/handover-assets/${id}/status`, { status });
  },

  toggleHandoverChecklist: (id, isDone) => {
    return callApi("PATCH", `/api/v1/handover-checklists/${id}`, { is_done: isDone });
  },

  searchUsers: (params) => {
    return callApi("GET", "/api/v1/users/search", null, params);
  },

  /**
   * Lấy danh sách Tỉnh/Thành phố
   */
  getProvinces: () => {
    return callApi("GET", "/api/v1/locations/provinces");
  },

  /**
   * Lấy danh sách Quận/Huyện theo Tỉnh
   * @param {string|number} provinceId 
   */
  updateAssetStatus: (assetId, formData) => {
    return callApi("PATCH", `/api/v1/assets/${assetId}/status`, formData);
  },
  getDistricts: (provinceId) => {
    return callApi("GET", "/api/v1/locations/districts", { province_id: provinceId });
  },

  /**
   * Thêm một hạng mục chi
   * @param {object} data - { program_id, name, unit_price, quantity }
   */
  addProgramItem: (data) => {
    return callApi("POST", "/api/v1/program-items", data);
  },

  /**
   * Thêm một mốc triển khai
   * @param {object} data - { program_id, milestone_name, milestone_date, milestone_type }
   */
  addProgramMilestone: (data) => {
    return callApi("POST", "/api/v1/program-milestones", data);
  },

  /**
   * Thêm thành viên phụ trách
   * @param {object} data - { program_id, user_id, role }
   */
  addProgramMember: (data) => {
    return callApi("POST", "/api/v1/program-members", data);
  },

  /**
   * Lấy danh sách tất cả người dùng
   */
  getUsers: () => {
    return callApi("GET", "/api/users/all-no-limit");
  },

  /**
   * Lấy danh sách người dùng với phân trang và tìm kiếm theo tên
   * @param {object} params - { page, limit, name }
   */
  getUsersLimit: (params) => {
    return callApi("GET", "/api/users/limit", null, params);
  },

  /**
   * Lấy danh sách phòng ban từ bảng departments2
   */
  getOrganizationUnits: () => {
    return callApi("GET", `/api/v1/asxh-departments`);
  },

  /**
   * Tìm kiếm văn bản đến (proxy qua BE)
   * @param {object} params - { page, limit }
   */
  searchIncomingDocuments: (params) => {
    return callApi("GET", `${API_PROGRAMS}/incoming-documents/search`, null, params);
  },

  /**
   * Lấy ánh xạ luồng phê duyệt động cho các module
   */
  getModuleWorkflowMapping: () => {
    return callApi("GET", "/api/v1/module-workflow/mappings");
  }
};

export default asxhService;
