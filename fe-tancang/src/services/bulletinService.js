import { callApi } from "./api";

const BASE_URL = "/api/v1";

const unwrapArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.result)) return payload.data.result;
  return [];
};

const bulletinService = {
  // Departments
  getDepartments: async () =>
    unwrapArray(await callApi("get", `${BASE_URL}/departments`)),
  getDepartmentById: (id) => callApi("get", `${BASE_URL}/departments/${id}`),
  createDepartment: (payload) =>
    callApi("post", `${BASE_URL}/departments`, payload),
  updateDepartment: (id, payload) =>
    callApi("put", `${BASE_URL}/departments/${id}`, payload),
  deleteDepartment: (id) => callApi("delete", `${BASE_URL}/departments/${id}`),
  updateDepartmentStatus: (id, isActive) =>
    callApi("patch", `${BASE_URL}/departments/${id}/status`, {
      is_active: isActive,
    }),
  getOrganizationUnits: async (params = {}) =>
    unwrapArray(await callApi("get", "/api/organization-units", params)),

  // Permissions & Roles
  getRoles: async () => unwrapArray(await callApi("get", `${BASE_URL}/roles`)),
  createRole: (payload) => callApi("post", `${BASE_URL}/roles`, payload),
  getPermissions: async () =>
    unwrapArray(await callApi("get", `${BASE_URL}/permissions`)),
  getPermissionMatrix: async (departmentId) =>
    unwrapArray(
      await callApi(
        "get",
        `${BASE_URL}/departments/${departmentId}/permission-matrix`
      )
    ),
  updatePermissionMatrix: (departmentId, payload) =>
    callApi(
      "put",
      `${BASE_URL}/departments/${departmentId}/permission-matrix`,
      payload
    ),
  getPermissionLogs: async (params = {}) =>
    callApi("get", "/api/system-logs-sql", {
      ...params,
      type: "BULLETIN_PERMISSION",
      sort: "timestamp,DESC",
    }),

  // Members
  getMembers: async (departmentId, params = {}) =>
    callApi("get", `${BASE_URL}/departments/${departmentId}/members`, params),
  addMember: (departmentId, userId, roleId) =>
    callApi("post", `${BASE_URL}/departments/${departmentId}/members`, {
      user_id: userId,
      role_id: roleId,
    }),
  updateMemberRole: (departmentId, userId, roleId) =>
    callApi(
      "put",
      `${BASE_URL}/departments/${departmentId}/members/${userId}`,
      { role_id: roleId }
    ),
  removeMember: (departmentId, userId) =>
    callApi(
      "delete",
      `${BASE_URL}/departments/${departmentId}/members/${userId}`
    ),
  getUsers: (params = {}) => callApi("get", "/api/users/limit", params),
  getUserRoles: async () =>
    unwrapArray(await callApi("get", `${BASE_URL}/my-roles`)),

  // Bulletins
  getBulletins: async (params = {}) =>
    unwrapArray(await callApi("get", `${BASE_URL}/bulletins`, params)),
  getBulletinById: (id) => callApi("get", `${BASE_URL}/bulletins/${id}`),
  createBulletin: (data) => callApi("post", `${BASE_URL}/bulletins`, data),
  updateBulletin: (id, data) =>
    callApi("put", `${BASE_URL}/bulletins/${id}`, data),
  increaseBulletinView: (id) =>
    callApi("post", `${BASE_URL}/bulletins/${id}/view`),
  submitBulletin: (id) => callApi("post", `${BASE_URL}/bulletins/${id}/submit`),
  approveBulletin: (id) =>
    callApi("post", `${BASE_URL}/bulletins/${id}/approve`),
  rejectBulletin: (id, comment) =>
    callApi("post", `${BASE_URL}/bulletins/${id}/reject`, { comment }),
  publishBulletin: (id) =>
    callApi("post", `${BASE_URL}/bulletins/${id}/publish`),
  unpublishBulletin: (id) =>
    callApi("post", `${BASE_URL}/bulletins/${id}/unpublish`),
  deleteBulletin: (id) => callApi("post", `${BASE_URL}/bulletins/${id}/delete`),
  getBulletinHistories: (id) =>
    callApi("get", `${BASE_URL}/bulletins/${id}/histories`),

  // Workflow Config
  getWorkflows: async (departmentId) =>
    unwrapArray(
      await callApi("get", `${BASE_URL}/departments/${departmentId}/workflows`)
    ),
  updateWorkflow: (departmentId, steps) =>
    callApi("put", `${BASE_URL}/departments/${departmentId}/workflows`, steps),
};

export default bulletinService;
