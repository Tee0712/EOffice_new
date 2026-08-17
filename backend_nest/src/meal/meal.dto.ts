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

export const TemplateItemSchema = z.object({
  day_offset: z.number(),
  meal_slot: z.string(),
  dish_id: z.number().or(z.string().transform(Number)),
  sort_order: z.number().default(0),
});

export const CreateTemplateSchema = z.object({
  name: z.string(),
  description: z.string().optional().nullable(),
  items: z.array(TemplateItemSchema),
});

export const ApplyTemplateSchema = z.object({
  template_id: z.number().or(z.string().transform(Number)),
  week_start: z.string(),
});


export type MenuItemDto = z.infer<typeof MenuItemSchema>;
export type MenuDto = z.infer<typeof MenuSchema>;
export type CreateWeeklyMenuDto = z.infer<typeof CreateWeeklyMenuSchema>;
export type TemplateItemDto = z.infer<typeof TemplateItemSchema>;
export type CreateTemplateDto = z.infer<typeof CreateTemplateSchema>;
export type ApplyTemplateDto = z.infer<typeof ApplyTemplateSchema>;

// Meal Registration DTOs
export const RegisterMealSchema = z.object({
  menu_id: z.number().or(z.string().transform(Number)),
  menu_item_id: z.number().or(z.string().transform(Number)).optional().nullable(),
});

export const BulkRegisterSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  slots: z.array(z.enum(['breakfast', 'lunch', 'dinner'])),
});


export const CancelRegistrationSchema = z.object({
  reason: z.string().optional().nullable(),
});

export const DailyMenuSchema = z.object({
  date: z.string(),
  menus: z.array(MenuSchema),
});

export const UpdateMenuStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'cancelled']),
});

export const CopyDailyMenuSchema = z.object({
  from_date: z.string(),
  to_date: z.string(),
});


export type RegisterMealDto = z.infer<typeof RegisterMealSchema>;
export type BulkRegisterDto = z.infer<typeof BulkRegisterSchema>;
export type CancelRegistrationDto = z.infer<typeof CancelRegistrationSchema>;
export type DailyMenuDto = z.infer<typeof DailyMenuSchema>;
export type UpdateMenuStatusDto = z.infer<typeof UpdateMenuStatusSchema>;
export type CopyDailyMenuDto = z.infer<typeof CopyDailyMenuSchema>;

// --- Module 2 & 3 DTOs ---

export const CheckInSchema = z.object({
  user_id: z.string(),
  menu_id: z.number().or(z.string().transform(Number)),
  menu_item_id: z.number().or(z.string().transform(Number)).optional().nullable(),
  method: z.enum(['qr', 'card', 'manual']).default('manual'),
  note: z.string().optional().nullable(),
});

export const ActualServingSchema = z.object({
  menu_id: z.number().or(z.string().transform(Number)),
  menu_item_id: z.number().or(z.string().transform(Number)).optional().nullable(),
  actual_qty: z.number(),
  source: z.enum(['kitchen', 'supplier', 'manual']).default('manual'),
  note: z.string().optional().nullable(),
});

export const SupplierContractSchema = z.object({
  supplier_id: z.number().or(z.string().transform(Number)),
  contract_no: z.string(),
  contract_type: z.string().optional().nullable(),
  start_date: z.string(),
  end_date: z.string(),
  value_amount: z.number(),
  status: z.enum(['active', 'expired', 'terminated', 'draft']).default('draft'),
  file_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});


export const SupplierOrderSchema = z.object({
  supplier_id: z.number().or(z.string().transform(Number)),
  menu_id: z.number().or(z.string().transform(Number)).optional().nullable(),
  order_date: z.string(),
  meal_slot: z.enum(['breakfast', 'lunch', 'dinner']),
  expected_qty: z.number(),
  unit_price: z.number(),
  status: z.enum(['draft', 'confirmed', 'delivered', 'cancelled']).default('draft'),
  note: z.string().optional().nullable(),
});

export const EvaluationScoreSchema = z.object({
  criterion_code: z.string(),
  score: z.number().min(1).max(5),
  comment: z.string().optional().nullable(),
});

export const SupplierEvaluationSchema = z.object({
  id: z.number().or(z.string().transform(Number)).optional().nullable(),
  supplier_id: z.number().or(z.string().transform(Number)).optional().nullable(),
  supplier_order_id: z.number().or(z.string().transform(Number)).optional().nullable(),
  period_type: z.enum(['delivery', 'monthly', 'quarterly']).default('delivery'),
  period_start_date: z.string().optional().nullable(),
  period_end_date: z.string().optional().nullable(),
  evaluation_status: z.enum(['draft', 'submitted', 'reviewed']).optional().nullable(),
  comment: z.string().optional().nullable(),
  scores: z.array(EvaluationScoreSchema).default([]),
  // Flat fields for new UI (mapped in controller)
  dish_id: z.number().or(z.string().transform(Number)).optional().nullable(),
  food_quality_score: z.number().optional(),
  delivery_time_score: z.number().optional(),
  hygiene_safety_score: z.number().optional(),
  service_attitude_score: z.number().optional(),
  order_id: z.string().or(z.number()).optional().nullable(),
});

export const DashboardFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  supplierId: z.number().or(z.string().transform(Number)).optional().nullable(),
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
    supplierId?: number;
    type: string;
    title: string;
    description: string;
    timeLabel: string;
    icon: string;
  }>;
  alerts: Array<{
    id: number;
    supplierId?: number;
    type: 'error' | 'warning' | 'info';
    title: string;
    description: string;
    actionLabel: string;
  }>;
  comparisonTable: any[];
}

export type CheckInDto = z.infer<typeof CheckInSchema>;
export type ActualServingDto = z.infer<typeof ActualServingSchema>;
export type SupplierContractDto = z.infer<typeof SupplierContractSchema>;
export type SupplierOrderDto = z.infer<typeof SupplierOrderSchema>;
export type SupplierEvaluationDto = z.infer<typeof SupplierEvaluationSchema>;
export type EvaluationScoreDto = z.infer<typeof EvaluationScoreSchema>;
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

export type WeeklyMenuSaveDto = z.infer<typeof WeeklyMenuSaveSchema>;
export const StartDateQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD'),
});
export type StartDateQueryDto = z.infer<typeof StartDateQuerySchema>;
export const DateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD'),
});
export type DateQueryDto = z.infer<typeof DateQuerySchema>;

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

export type DailyMenuSetupSaveDto = z.infer<typeof DailyMenuSetupSaveSchema>;

export interface SupplierOverviewDto {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

export interface SupplierDetailTabCountsDto {
  contracts: number;
  evaluations: number;
  orders: number;
}

export interface SupplierDetailDto {
  id: number;
  name: string;
  supplier_code: string;
  type?: string;
  tax_code?: string;
  address?: string;
  phone?: string;
  email?: string;
  representative_name?: string;
  logo_url?: string;
  is_active: number;
  rating_avg: number;
  rating_count: number;
  total_contract_value: number;
  tab_counts: SupplierDetailTabCountsDto;
}

export interface SupplierContractListItemDto {
  id: number;
  contract_no: string;
  contract_type?: string | null;
  start_date: string;
  end_date: string;
  value_amount: number;
  status: string;
  remaining_days: number;
}

export interface SupplierEvaluationStatsDto {
  total: number;
  pending: number;
  excellent: number;
  good: number;
  improvement: number;
}
