import { callApi } from "./api";
import {
  API_EVENT_MANAGEMENT_EVENTS,
  API_EVENT_MANAGEMENT_NOTIFICATIONS,
  API_EVENT_MANAGEMENT_RECIPIENTS,
  API_EVENT_MANAGEMENT_LOGISTICS,
  API_EVENT_MANAGEMENT_DEPARTMENTS,
  API_UPLOAD_FILE
} from "@EnvironmentFile/constants/urlConfig";

/**
 * 1. EVENTS API
 */
export const getEvents = (params) => callApi("get", API_EVENT_MANAGEMENT_EVENTS, params);
export const getEventDetail = (id) => callApi("get", `${API_EVENT_MANAGEMENT_EVENTS}/${id}`);
export const createEvent = (data) => callApi("post", API_EVENT_MANAGEMENT_EVENTS, data);
export const updateEvent = (id, data) => callApi("put", `${API_EVENT_MANAGEMENT_EVENTS}/${id}`, data);
export const deleteEvent = (id) => callApi("delete", `${API_EVENT_MANAGEMENT_EVENTS}/${id}`);
export const updateEventStatus = (id, payload) => callApi("patch", `${API_EVENT_MANAGEMENT_EVENTS}/${id}/status`, payload);
export const getEventDashboard = () => callApi("get", `${API_EVENT_MANAGEMENT_EVENTS}/dashboard/summary`);
export const getEventSummary = (params) => callApi("get", `${API_EVENT_MANAGEMENT_EVENTS}/summary`, params);
export const getEventInteractionStats = (eventId) => callApi("get", `${API_EVENT_MANAGEMENT_EVENTS}/${eventId}/interaction-stats`);
export const getEventSatisfactionSurvey = (eventId) => callApi("get", `${API_EVENT_MANAGEMENT_EVENTS}/${eventId}/satisfaction-survey`);
export const upsertEventSatisfactionSurvey = (eventId, data) => callApi("post", `${API_EVENT_MANAGEMENT_EVENTS}/${eventId}/satisfaction-survey`, data);
export const submitEventSatisfactionResponse = (eventId, data) => callApi("post", `${API_EVENT_MANAGEMENT_EVENTS}/${eventId}/satisfaction-survey/submit`, data);
export const getSuggestedDepartments = () => callApi("get", `${API_EVENT_MANAGEMENT_EVENTS}/departments/suggested`);
export const uploadEventAttachment = (id, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return callApi("post", `${API_EVENT_MANAGEMENT_EVENTS}/${id}/attachments`, formData);
};

/**
 * 2. NOTIFICATIONS API
 */
export const createNotification = (eventId, data) => callApi("post", `${API_EVENT_MANAGEMENT_EVENTS}/${eventId}/notifications`, data);
export const getNotificationsByEvent = (eventId) => callApi("get", `${API_EVENT_MANAGEMENT_EVENTS}/${eventId}/notifications`);
export const getNotificationDetail = (notificationId) => callApi("get", `${API_EVENT_MANAGEMENT_NOTIFICATIONS}/${notificationId}`);
export const recallNotification = (notificationId) => callApi("post", `${API_EVENT_MANAGEMENT_NOTIFICATIONS}/${notificationId}/recall`);
export const remindNotification = (notificationId, data) => callApi("post", `${API_EVENT_MANAGEMENT_NOTIFICATIONS}/${notificationId}/remind`, data);

/**
 * 3. RECIPIENTS / CONFIRMATIONS API
 */
export const confirmParticipation = (recipientId, data) => callApi("post", `${API_EVENT_MANAGEMENT_RECIPIENTS}/${recipientId}/confirm`, data);
export const getRecipientConfirmation = (recipientId) => callApi("get", `${API_EVENT_MANAGEMENT_RECIPIENTS}/${recipientId}/confirmation`);
export const updateRecipientStatus = (recipientId, payload) => callApi("patch", `${API_EVENT_MANAGEMENT_RECIPIENTS}/${recipientId}/status`, payload);
export const updateRecipientQuota = (recipientId, payload) => callApi("patch", `${API_EVENT_MANAGEMENT_RECIPIENTS}/${recipientId}/quota`, payload);

/**
 * 4. GUESTS REGISTRATION API
 */
export const registerGuest = (eventId, departmentId, data) => callApi("post", `${API_EVENT_MANAGEMENT_EVENTS}/${eventId}/departments/${departmentId}/guests`, data);
export const getGuestsByEvent = (eventId, params) => callApi("get", `${API_EVENT_MANAGEMENT_EVENTS}/${eventId}/guests`, params);
export const getGuestsByDepartment = (eventId, departmentId, params) => callApi("get", `${API_EVENT_MANAGEMENT_EVENTS}/${eventId}/departments/${departmentId}/guests`, params);
export const checkGuestDuplicate = (eventId, params) => callApi("get", `${API_EVENT_MANAGEMENT_EVENTS}/${eventId}/guests/check-duplicate`, params);
export const deleteGuest = (eventId, registrationId) => callApi("delete", `${API_EVENT_MANAGEMENT_EVENTS}/${eventId}/guests/registrations/${registrationId}`);

/**
 * 5. LOGISTICS API
 */
export const createLogisticsRequirement = (eventId, data) => callApi("post", `${API_EVENT_MANAGEMENT_EVENTS}/${eventId}/logistics`, data);
export const updateLogisticsRequirement = (logisticsId, data) => callApi("put", `${API_EVENT_MANAGEMENT_LOGISTICS}/${logisticsId}`, data);
export const getLogisticsByEvent = (eventId) => callApi("get", `${API_EVENT_MANAGEMENT_EVENTS}/${eventId}/logistics`);

/**
 * 6. DEPARTMENTS API (Shared)
 */
export const getDepartments = (params) => callApi("get", API_EVENT_MANAGEMENT_DEPARTMENTS, params);
