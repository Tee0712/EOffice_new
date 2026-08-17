import { z } from "zod";

export const canteenRegistrationSchema = z.object({
  user_id: z.string().min(1, "Vui lòng chọn nhân viên"),
  menu_id: z.number().or(z.string().transform(Number)),
  menu_item_id: z.number().or(z.string().transform(Number)).optional().nullable(),
  status: z.enum(["registered", "cancelled", "auto_cut"]).default("registered"),
  cancel_reason: z.string().optional().nullable(),
});

export const filterParamsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày không hợp lệ (YYYY-MM-DD)"),
  dept: z.string().optional(),
  slot: z.enum(["", "breakfast", "lunch", "dinner"]).optional(),
  keyword: z.string().optional(),
});

export const cancelRegistrationSchema = z.object({
  reason: z.string().min(1, "Vui lòng nhập lý do hủy"),
});

/**
 * @typedef {Object} SystemSetting
 * @property {number} id
 * @property {string} group
 * @property {string} key
 * @property {string|boolean|number} value
 * @property {string} value_type
 * @property {string} label
 * @property {string} description
 */

export const systemSettingsSchema = z.object({
  id: z.number(),
  value: z.any(),
});

export const updateSettingsSchema = z.object({
  id: z.number(),
  value: z.any(),
});

export const bulkSettingsSchema = z.array(systemSettingsSchema);

export const settingsGroupSchema = z.record(z.record(z.object({
  id: z.number(),
  value: z.any(),
  value_type: z.string(),
  label: z.string(),
  description: z.string().optional(),
})));

/** @typedef {z.infer<typeof canteenRegistrationSchema>} CanteenRegistration */
/** @typedef {z.infer<typeof filterParamsSchema>} FilterParams */
/** @typedef {z.infer<typeof cancelRegistrationSchema>} CancelRegistration */
/** @typedef {z.infer<typeof systemSettingsSchema>} SystemSetting */
/** @typedef {z.infer<typeof updateSettingsSchema>} UpdateSetting */
/** @typedef {z.infer<typeof bulkSettingsSchema>} BulkSettings */
/** @typedef {z.infer<typeof settingsGroupSchema>} SettingsGroup */
