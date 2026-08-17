import { z } from "zod";

/**
 * Schema cho API 1: Thống kê tổng hợp (KPI Cards)
 */
export const summarySchema = z.object({
  total_budget: z.number(),
  total_budget_growth: z.number().nullable().optional(),
  disbursed_amount: z.number(),
  disbursed_rate: z.number(),
  total_programs: z.number(),
  new_programs: z.number(),
  total_beneficiaries: z.number(),
  beneficiaries_growth: z.number().nullable().optional(),
});

/**
 * Schema cho API 2: Xu hướng giải ngân theo tháng
 */
export const trendItemSchema = z.object({
  month: z.number(),
  cash_amount: z.number(),
  in_kind_amount: z.number(),
  education_amount: z.number(),
  total_amount: z.number(),
});

export const trendSchema = z.array(trendItemSchema);

/**
 * Schema cho API 3: Phân bổ theo loại hình tài trợ
 */
export const distributionItemSchema = z.object({
  funding_type: z.string(),
  label: z.string(),
  amount: z.number(),
  percentage: z.number(),
  color: z.string(),
});

export const distributionSchema = z.object({
  total_budget: z.number(),
  items: z.array(distributionItemSchema),
});

/**
 * Schema cho API 4: Danh sách chương trình ASXH đang triển khai
 */
export const programItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  funding_type: z.string(),
  funding_type_label: z.string().optional(),
  locality: z.string(),
  budget: z.number(),
  progress: z.number(),
  status: z.string(),
  status_label: z.string().optional(),
});

export const programsSchema = z.object({
  total: z.number(),
  page: z.number().optional(),
  page_size: z.number().optional(),
  items: z.array(programItemSchema),
});

/**
 * Schema cho API 6: Sự kiện sắp tới
 */
export const eventItemSchema = z.object({
  id: z.number(),
  event_date: z.string(),
  day: z.number().optional(),
  month: z.number().optional(),
  title: z.string(),
  description: z.string(),
  event_type: z.string(),
  badge_label: z.string(),
  badge_color: z.string(),
  program_id: z.number().optional(),
});

export const eventsSchema = z.object({
  items: z.array(eventItemSchema),
});

/**
 * Schema cho API 7: Phân bổ ngân sách theo khu vực (Top 5)
 */
export const localityDistributionItemSchema = z.object({
  name: z.string(),
  value: z.number(),
});

export const localityDistributionSchema = z.array(localityDistributionItemSchema);
