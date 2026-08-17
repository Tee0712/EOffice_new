import { z } from 'zod';

export const RegisterMealSchema = z.union([
  z.object({
    menu_id: z.number().or(z.string().transform(Number)),
    menu_item_id: z.number().or(z.string().transform(Number)).optional().nullable(),
  }),
  z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    meal_session_ids: z.array(z.number().int().positive()).min(1),
    note: z.string().max(500).optional().nullable(),
  }),
]);

export const BulkRegisterSchema = z.union([
  z.object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    slots: z.array(z.enum(['breakfast', 'lunch', 'dinner'])),
  }),
  z.object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    days_of_week: z.array(z.number().int().min(0).max(6)),
    meal_session_ids: z.array(z.number().int().positive()).min(1),
    template_id: z.number().int().positive().optional(),
  }),
]);

export const CancelRegistrationSchema = z.object({
  reason: z.string().optional().nullable(),
});

export const UpdateRegistrationSchema = z.object({
  meal_session_ids: z.array(z.number().int().positive()).min(1),
  note: z.string().max(500).optional().nullable(),
});

export type RegisterMealDto = z.infer<typeof RegisterMealSchema>;
export type BulkRegisterDto = z.infer<typeof BulkRegisterSchema>;
export type CancelRegistrationDto = z.infer<typeof CancelRegistrationSchema>;
export type UpdateRegistrationDto = z.infer<typeof UpdateRegistrationSchema>;
