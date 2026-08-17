import { callApi } from "./api";

const BASE_URL = "/api";

const announcementService = {
  // --- Admin APIs (Management) ---

  /**
   * Create a new announcement.
   */
  createAnnouncement: (data) =>
    callApi("post", `${BASE_URL}/announcements`, data),

  /**
   * Get list of announcements for admin.
   */
  getAdminAnnouncements: (params = {}) =>
    callApi("get", `${BASE_URL}/announcements`, params),

  /**
   * Get detailed announcement for admin.
   */
  getAdminAnnouncementById: (id) =>
    callApi("get", `${BASE_URL}/announcements/${id}`),

  /**
   * Update an existing announcement.
   */
  updateAnnouncement: (id, data) =>
    callApi("patch", `${BASE_URL}/announcements/${id}`, data),

  /**
   * Soft delete an announcement.
   */
  deleteAnnouncement: (id) =>
    callApi("delete", `${BASE_URL}/announcements/${id}`),

  /**
   * Get basic statistics for an announcement.
   */
  getAnnouncementStatistics: (id) =>
    callApi("get", `${BASE_URL}/announcements/${id}/statistics`),

  /**
   * Get detailed read status log.
   */
  getAnnouncementReadStatus: (id) =>
    callApi("get", `${BASE_URL}/announcements/${id}/read-status`),

  /**
   * Send reminder notifications.
   */
  sendReminders: (id) =>
    callApi("post", `${BASE_URL}/announcements/${id}/remind`),

  /**
   * Toggle pinned status.
   */
  togglePinAnnouncement: (id, isPinned) =>
    callApi("patch", `${BASE_URL}/announcements/${id}/pin`, {
      is_pinned: isPinned,
    }),

  /**
   * Toggle allow comment status.
   */
  toggleCommentAnnouncement: (id, allowComment) =>
    callApi("patch", `${BASE_URL}/announcements/${id}/comment`, {
      allow_comment: allowComment,
    }),

  // --- User APIs (Inbox) ---

  /**
   * Get current user's inbox list.
   */
  getUserInbox: (params = {}) =>
    callApi("get", `${BASE_URL}/user/inbox`, params),

  /**
   * Get unread announcement count.
   */
  getUnreadCount: () => callApi("get", `${BASE_URL}/user/inbox/unread-count`),

  /**
   * Mark all unread announcements as read for current user.
   */
  markAllRead: () => callApi("patch", `${BASE_URL}/user/inbox/mark-all-read`),

  /**
   * View details of an announcement in the inbox.
   */
  getInboxAnnouncementDetail: (id) =>
    callApi("get", `${BASE_URL}/user/inbox/${id}`),

  /**
   * Get previous and next announcement IDs.
   */
  getNavigationNeighbors: (id) =>
    callApi("get", `${BASE_URL}/user/inbox/${id}/neighbors`),

  /**
   * Confirm user has read this announcement.
   */
  confirmAnnouncementRead: (id) =>
    callApi("patch", `${BASE_URL}/user/inbox/${id}/confirm`),

  /**
   * Get organization units for target selection.
   */
  getOrganizationUnits: (params = {}) =>
    callApi("get", `/api/organization-units`, params),

  /**
   * Get all users for recipient counting.
   */
  getAllUsers: () => callApi("get", `/api/users/all-no-limit`),

  // --- Support APIs ---

  /**
   * Upload an attachment file.
   */
  uploadAttachment: (formData) =>
    callApi("post", `${BASE_URL}/attachments/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default announcementService;
