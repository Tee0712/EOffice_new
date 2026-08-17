import { z } from 'zod';

export const MenuItemSchema = z.object({
  dish_id: z.number().or(z.string().transform(Number)),
  unit_price_snapshot: z.number().default(0),
  unit: z.string().default('suất'),
  sort_order: z.number().default(0),
});

export const MenuSchema = z.object({
  menu_date: z.string(),
  meal_slot: z.enum(['breakfast', 'lunch', 'dinner']),
  supplier_id: z.number().or(z.string().transform(Number)).optional().nullable(),
  register_deadline_at: z.string(),
  cancel_deadline_at: z.string(),
  note: z.string().optional().nullable(),
  serving_time: z.string().optional().nullable(),
  image_url_manual: z.string().optional().nullable(),
  description_manual: z.string().optional().nullable(),
  title_manual: z.string().optional().nullable(),
  price_total_planned: z.number().optional().nullable(),
  items: z.array(MenuItemSchema).default([]),
});

export const CreateWeeklyMenuSchema = z.object({
  week_start: z.string(),
  menus: z.array(MenuSchema),
});

export const WeeklyMenuSaveSchema = z.object({
  startDate: z.string(),
  days: z.array(z.object({
    date: z.string(),
    meals: z.object({
      breakfast: z.array(z.number().or(z.string().transform(Number))).default([]),
      lunch: z.array(z.number().or(z.string().transform(Number))).default([]),
      dinner: z.array(z.number().or(z.string().transform(Number))).default([]),
    }),
  })),
});

export const DailyMenuSetupSaveSchema = z.object({
  date: z.string(),
  note: z.string().optional().nullable(),
  meals: z.object({
    breakfast: z.array(z.object({
      dish_id: z.number().or(z.string().transform(Number)),
      actual_qty: z.number().optional().nullable(),
    })).default([]),
    lunch: z.array(z.object({
      dish_id: z.number().or(z.string().transform(Number)),
      actual_qty: z.number().optional().nullable(),
    })).default([]),
    dinner: z.array(z.object({
      dish_id: z.number().or(z.string().transform(Number)),
      actual_qty: z.number().optional().nullable(),
    })).default([]),
  }),
});

export const DailyMenuSchema = z.object({
  date: z.string(),
  menus: z.array(MenuSchema),
});

export const StartDateQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD'),
});

export const DateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD'),
});

// For older API versions
export const CreateDailyMenuSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD'),
  meal_session_id: z.number().int().positive("ID bữa ăn phải là số dương"),
  dish_name: z.string().min(1, "Tên món ăn không được để trống").max(500, "Tên món ăn không được vượt quá 500 ký tự"),
  description: z.string().optional().nullable(),
  price: z.number().positive("Giá tiền phải là số dương"),
  serving_time: z.string().max(20, "Thời gian phục vụ không được vượt quá 20 ký tự").optional().nullable(),
  photo_url: z.string().max(500, "URL ảnh không được vượt quá 500 ký tự").optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const UpdateDailyMenuSchema = CreateDailyMenuSchema.partial();

export const UpdateMenuStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'cancelled']),
});

export const CopyDailyMenuSchema = z.object({
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày bắt đầu không hợp lệ (YYYY-MM-DD)'),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày kết thúc không hợp lệ (YYYY-MM-DD)'),
});

export type MenuItemDto = z.infer<typeof MenuItemSchema>;
export type MenuDto = z.infer<typeof MenuSchema>;
export type CreateWeeklyMenuDto = z.infer<typeof CreateWeeklyMenuSchema>;
export type WeeklyMenuSaveDto = z.infer<typeof WeeklyMenuSaveSchema>;
export type DailyMenuSetupSaveDto = z.infer<typeof DailyMenuSetupSaveSchema>;
export type DailyMenuDto = z.infer<typeof DailyMenuSchema>;
export type StartDateQueryDto = z.infer<typeof StartDateQuerySchema>;
export type DateQueryDto = z.infer<typeof DateQuerySchema>;
export type CreateDailyMenuDto = z.infer<typeof CreateDailyMenuSchema>;
export type UpdateDailyMenuDto = z.infer<typeof UpdateDailyMenuSchema>;
export type UpdateMenuStatusDto = z.infer<typeof UpdateMenuStatusSchema>;
export type CopyDailyMenuDto = z.infer<typeof CopyDailyMenuSchema>;
