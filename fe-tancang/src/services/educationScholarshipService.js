import { callApi } from "./api";

const API_SCHOLARSHIP = "/api/v1/education-scholarships";
const API_PARTNERS = "/api/v1/education-scholarships/partners";
const API_CANDIDATES = "/api/v1/education-scholarships/candidates";

/**
 * Service quản lý Tài trợ Giáo dục & Học bổng
 */
const educationScholarshipService = {
  /**
   * Lấy dữ liệu tổng quan (Dashboard)
   */
  getOverview: (params) => {
    return callApi("GET", `${API_SCHOLARSHIP}/overview`, params);
  },

  // --- UNIVERSITY PARTNERS ---

  /**
   * Lấy danh sách đối tác đại học
   * @param {object} params - { keyword, school_year, page, limit }
   */
  getUniversityPartners: (params) => {
    return callApi("GET", API_PARTNERS, params);
  },

  /**
   * Lấy chi tiết đối tác
   */
  getPartnerDetail: (id) => {
    return callApi("GET", `${API_PARTNERS}/${id}`);
  },

  /**
   * Tạo mới đối tác
   */
  createPartner: (data) => {
    return callApi("POST", API_PARTNERS, data);
  },

  /**
   * Cập nhật đối tác
   */
  updatePartner: (id, data) => {
    return callApi("PUT", `${API_PARTNERS}/${id}`, data);
  },

  /**
   * Xóa đối tác
   */
  deletePartner: (id) => {
    return callApi("DELETE", `${API_PARTNERS}/${id}`);
  },

  /**
   * Thay đổi trạng thái đối tác (Hoạt động / Tạm dừng)
   */
  togglePartnerStatus: (id) => {
    return callApi("PATCH", `${API_PARTNERS}/${id}/status`);
  },

  // --- SCHOLARSHIP CANDIDATES ---

  /**
   * Lấy danh sách ứng viên
   * @param {object} params - { keyword, university_partner_id, status, school_year, page, limit }
   */
  getScholarshipCandidates: (params) => {
    return callApi("GET", API_CANDIDATES, params);
  },

  /**
   * Xem trước mã hồ sơ ứng viên
   */
  previewCandidateCode: () => {
    return callApi("GET", `${API_CANDIDATES}/preview-code`);
  },

  /**
   * Lấy chi tiết ứng viên
   */
  getCandidateDetail: (id) => {
    return callApi("GET", `${API_CANDIDATES}/${id}`);
  },

  /**
   * Tạo mới ứng viên
   */
  createCandidate: (data) => {
    return callApi("POST", API_CANDIDATES, data);
  },

  /**
   * Cập nhật ứng viên
   */
  updateCandidate: (id, data) => {
    return callApi("PUT", `${API_CANDIDATES}/${id}`, data);
  },

  /**
   * Cập nhật trạng thái ứng viên (Pipeline)
   * @param {number} id 
   * @param {string} status - SUBMITTED, UNDER_REVIEW, INTERVIEW, APPROVED, REJECTED, DISBURSED
   */
  updateCandidateStatus: (id, status) => {
    return callApi("PATCH", `${API_CANDIDATES}/${id}/status`, { status });
  },

  /**
   * Xóa ứng viên
   */
  deleteCandidate: (id) => {
    return callApi("DELETE", `${API_CANDIDATES}/${id}`);
  },

  // --- FILE UPLOADS ---

  /**
   * Upload logo cho đối tác
   */
  uploadPartnerLogo: (id, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return callApi("POST", `${API_PARTNERS}/${id}/logo`, formData);
  },

  /**
   * Upload tài liệu cho đối tác
   */
  uploadPartnerAttachment: (id, data) => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("title", data.title);
    if (data.doc_type) formData.append("doc_type", data.doc_type);
    return callApi("POST", `${API_PARTNERS}/${id}/attachments`, formData);
  },

  /**
   * Xóa tài liệu đối tác
   */
  deletePartnerAttachment: (attachmentId) => {
    return callApi("DELETE", `${API_PARTNERS}/attachments/${attachmentId}`);
  },

  /**
   * Upload avatar cho ứng viên
   */
  uploadCandidateAvatar: (id, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return callApi("POST", `${API_CANDIDATES}/${id}/avatar`, formData);
  },

  /**
   * Upload tài liệu cho ứng viên
   */
  uploadCandidateAttachment: (id, data) => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("title", data.title);
    if (data.doc_type) formData.append("doc_type", data.doc_type);
    if (data.is_required !== undefined) formData.append("is_required", data.is_required);
    if (data.status) formData.append("status", data.status);
    return callApi("POST", `${API_CANDIDATES}/${id}/attachments`, formData);
  },

  /**
   * Xóa tài liệu ứng viên
   */
  deleteCandidateAttachment: (attachmentId) => {
    return callApi("DELETE", `${API_CANDIDATES}/attachments/${attachmentId}`);
  },

  /**
   * Xuất báo cáo Excel
   */
  exportScholarshipReport: (schoolYear) => {
    return callApi("GET", `${API_SCHOLARSHIP}/export`, { school_year: schoolYear }, { responseType: 'blob' });
  },
};

export default educationScholarshipService;
