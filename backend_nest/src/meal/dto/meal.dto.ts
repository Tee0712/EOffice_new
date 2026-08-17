import { z } from 'zod';

// ---- Daily Menu ----
export const CreateDailyMenuSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  meal_session_id: z.number().int().positive(),
  dish_name: z.string().min(1).max(500),
  description: z.string().optional().nullable(),
  price: z.number().positive(),
  serving_time: z.string().max(20).optional().nullable(),
  photo_url: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const UpdateDailyMenuSchema = CreateDailyMenuSchema.partial();

export type CreateDailyMenuDto = z.infer<typeof CreateDailyMenuSchema>;
export type UpdateDailyMenuDto = z.infer<typeof UpdateDailyMenuSchema>;

// ---- Registration ----
export const RegisterMealSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meal_session_ids: z.array(z.number().int().positive()).min(1),
  note: z.string().max(500).optional().nullable(),
});

export type RegisterMealDto = z.infer<typeof RegisterMealSchema>;

// ---- Bulk Register ----
export const BulkRegisterSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days_of_week: z.array(z.number().int().min(0).max(6)), // 0=Sun...6=Sat
  meal_session_ids: z.array(z.number().int().positive()).min(1).optional(),
  template_id: z.number().int().positive().optional(),
}).refine(
  (data) => (Array.isArray(data.meal_session_ids) && data.meal_session_ids.length > 0) || !!data.template_id,
  {
    message: 'Cần truyền meal_session_ids hoặc template_id',
    path: ['meal_session_ids'],
  },
);

export type BulkRegisterDto = z.infer<typeof BulkRegisterSchema>;

// ---- Cancel Registration ----
export const CancelRegistrationSchema = z.object({
  reason: z.string().max(500).optional().nullable(),
});

export type CancelRegistrationDto = z.infer<typeof CancelRegistrationSchema>;

// ---- Update Registration (thêm/bớt ca) ----
export const UpdateRegistrationSchema = z.object({
  meal_session_ids: z.array(z.number().int().positive()).min(1),
  note: z.string().max(500).optional().nullable(),
});

export type UpdateRegistrationDto = z.infer<typeof UpdateRegistrationSchema>;

// ---- Meal Template ----
export const CreateMealTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  meal_session_ids: z.array(z.number().int().positive()).min(1),
  is_system: z.boolean().optional().default(false),
});

export type CreateMealTemplateDto = z.infer<typeof CreateMealTemplateSchema>;

// ---- System Settings ----
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

export type UpdateSystemSettingDto = z.infer<typeof UpdateSystemSettingSchema>;

// ---- User Settings ----
export const UpdateUserSettingSchema = z.object({
  auto_cancel_on_trip: z.boolean().optional(),
  auto_cancel_on_leave: z.boolean().optional(),
  receive_email_notification: z.boolean().optional(),
  remind_before_1_day: z.boolean().optional(),
});

export type UpdateUserSettingDto = z.infer<typeof UpdateUserSettingSchema>;

// ---- Meal Session ----
export const CreateMealSessionSchema = z.object({
  name: z.string().min(1).max(50),
  time_start: z.string().regex(/^\d{2}:\d{2}$/),
  time_end: z.string().regex(/^\d{2}:\d{2}$/),
  icon: z.string().max(255).optional().nullable(),
  sort_order: z.number().int().default(0),
});

export const UpdateMealSessionSchema = CreateMealSessionSchema.partial();


export type CreateMealSessionDto = z.infer<typeof CreateMealSessionSchema>;
export type UpdateMealSessionDto = z.infer<typeof UpdateMealSessionSchema>;

// ---- Check-in ----
export const MealCheckinSchema = z.object({
  user_id: z.string().min(1),
  menu_id: z.number().int().positive(),
  menu_item_id: z.number().int().positive().optional().nullable(),
  registration_id: z.number().int().positive().optional().nullable(),
  method: z.enum(['qr', 'card', 'manual']).default('manual'),
  note: z.string().max(255).optional().nullable(),
});

export type MealCheckinDto = z.infer<typeof MealCheckinSchema>;

export const UpdateCheckinStatusSchema = z.object({
  status: z.enum(['checked', 'absent', 'pending']),
  registration_id: z.coerce.number().int().positive(),
  note: z.string().max(255).optional().nullable(),
});



export type UpdateCheckinStatusDto = z.infer<typeof UpdateCheckinStatusSchema>;

// ---- Check-in List Query ----
const SLOT_ALIASES = [
  'breakfast',
  'lunch',
  'dinner',
  'sang',
  'trua',
  'toi',
  'an sang',
  'an trua',
  'an toi',
  'ăn sáng',
  'ăn trưa',
  'ăn tối',
];

function isValidSlotInput(value: string): boolean {
  const raw = String(value || '').trim();
  if (!raw) return false;

  const lowered = raw.toLowerCase();
  if (SLOT_ALIASES.includes(lowered)) return true;

  const normalized = lowered
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();

  return SLOT_ALIASES.includes(normalized);
}

export const CheckinListQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  slot: z
    .string()
    .optional()
    .transform((v) => {
      const s = String(v ?? '').trim();
      return s ? s : undefined;
    })
    .refine((v) => v === undefined || isValidSlotInput(v), {
      message: 'Slot không hợp lệ',
    }),
  q: z
    .string()
    .optional()
    .transform((v) => {
      const s = String(v ?? '').trim();
      return s ? s : undefined;
    }),
  dept: z
    .string()
    .optional()
    .transform((v) => {
      const s = String(v ?? '').trim();
      return s ? s : undefined;
    }),
});

export type CheckinListQueryDto = z.infer<typeof CheckinListQuerySchema>;

// ---- Dashboard ----
export const DashboardFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  supplierId: z.coerce.number().optional().nullable(),
  contractType: z.string().optional().nullable(),
});

export type DashboardFilterDto = z.infer<typeof DashboardFilterSchema>;

export interface DashboardSummaryDto {
  kpis: {
    totalSuppliers: { value: number; trend: string; trendValue: number };
    monthlyOrders: { value: number; trend: string; trendValue: number };
    mealsProvided: { value: number; trend: string; trendValue: number };
    totalCost: { value: number; trend: string; trendValue: number };
    overallRating: { value: number; trend: string; trendValue: number };
  };
  ranking: Array<{
    id: number;
    name: string;
    logo_url: string;
    orderCount: number;
    mealCount: number;
    rating: number;
  }>;
  trends: {
    months: string[];
    series: Array<{
      supplierName: string;
      data: number[];
    }>;
  };
  costDistribution: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  orderQuantityByMeal: Array<{
    supplierName: string;
    breakfast: number;
    lunch: number;
    dinner: number;
  }>;
  criteriaAverages: Array<{
    code: string;
    name: string;
    value: number;
  }>;
  recentActivities: Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    timeLabel: string;
    icon: string;
  }>;
  alerts: Array<{
    id: number;
    type: 'error' | 'warning' | 'info';
    title: string;
    description: string;
    actionLabel: string;
  }>;
  comparisonTable: Array<{
    id: number;
    name: string;
    orderCount: number;
    mealCount: number;
    revenue: number;
    rating: number;
    qualityRating: number;
    ontimeRating: number;
    trendValue: number;
    performance: number;
  }>;
}
