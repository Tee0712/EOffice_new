/**
 * Định nghĩa các feature và rules phân quyền theo vai trò
 * Dùng cho permissionUtils.js
 */

export const ROLE_ACCESS_FEATURE = {
  MEAL_FEEDBACK_DETAIL: "MEAL_FEEDBACK_DETAIL",
};

export const ROLE_ACCESS_RULES = {
  [ROLE_ACCESS_FEATURE.MEAL_FEEDBACK_DETAIL]: {
    allowKeywords: [
      "super_admin",
      "admin",
      "canteen_admin",
      "canteen_manager",
      "quan_ly_an_ca",
      "to_truong_an_ca",
    ],
    denyKeywords: [],
  },
};
