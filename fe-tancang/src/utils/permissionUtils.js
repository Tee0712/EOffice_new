import {
  ROLE_ACCESS_FEATURE as FEATURE_KEYS,
  ROLE_ACCESS_RULES,
} from "../constants/roleAccessRules";

const normalizeRoleToken = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const extractUserRoleCandidates = (userData) => {
  if (!userData) return [];

  const roleCodes = Array.isArray(userData?.roleCodes)
    ? userData.roleCodes
    : [];
  const dynamicRoles = Array.isArray(userData?.roles) ? userData.roles : [];
  const staticRoleFields = Array.isArray(userData?.staticPermissions)
    ? userData.staticPermissions.flatMap((item) => [item?.code, item?.name])
    : [];
  const basicRole = userData?.role ? [userData.role] : [];

  return [
    ...roleCodes,
    ...dynamicRoles,
    ...staticRoleFields,
    ...basicRole,
  ].filter(Boolean);
};

const hasKeyword = (tokens = [], keywords = []) =>
  tokens.some((token) =>
    keywords.some((keyword) => token.includes(normalizeRoleToken(keyword)))
  );

export const canAccessRoleFeature = (feature, userData) => {
  const rule = ROLE_ACCESS_RULES?.[feature];
  if (!rule) return false;

  const roleTokens =
    extractUserRoleCandidates(userData).map(normalizeRoleToken);
  if (!roleTokens.length) return false;

  if (hasKeyword(roleTokens, rule.allowKeywords || [])) return true;
  if (hasKeyword(roleTokens, rule.denyKeywords || [])) return false;
  return false;
};

export const canAccessCanteenEvaluation = (userData) =>
  canAccessRoleFeature(FEATURE_KEYS.MEAL_FEEDBACK_DETAIL, userData);

export const ROLE_ACCESS_FEATURE = FEATURE_KEYS;
