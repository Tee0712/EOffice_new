import { z } from 'zod';

export const UpdateSystemSettingSchema = z.object({
  registration_deadline_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  cancellation_deadline_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  allow_multi_meal: z.boolean().optional(),
  allow_bulk_registration: z.boolean().optional(),
  auto_cancel_on_business_trip: z.boolean().optional(),
  auto_cancel_on_leave: z.boolean().optional(),
  require_cancel_reason: z.boolean().optional(),
  weekend_service: z.boolean().optional(),
  refund_rate_on_time: z.number().min(0).max(100).optional(),
  refund_rate_late: z.number().min(0).max(100).optional(),
});

export const UpdateUserSettingSchema = z.object({
  auto_cancel_on_trip: z.boolean().optional(),
  auto_cancel_on_leave: z.boolean().optional(),
  receive_email_notification: z.boolean().optional(),
  remind_before_1_day: z.boolean().optional(),
});

export type UpdateSystemSettingDto = z.infer<typeof UpdateSystemSettingSchema>;
export type UpdateUserSettingDto = z.infer<typeof UpdateUserSettingSchema>;
