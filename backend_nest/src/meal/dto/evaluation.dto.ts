import { z } from 'zod';

export const EvaluationScoreSchema = z.object({
  criterion_code: z.string(),
  score: z.number().min(1, "Điểm đánh giá tối thiểu là 1").max(5, "Điểm đánh giá tối đa là 5"),
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
  // Flat fields for new UI
  dish_id: z.number().or(z.string().transform(Number)).optional().nullable(),
  food_quality_score: z.number().optional(),
  delivery_time_score: z.number().optional(),
  hygiene_safety_score: z.number().optional(),
  service_attitude_score: z.number().optional(),
  order_id: z.string().or(z.number()).optional().nullable(),
});

export interface SupplierEvaluationStatsDto {
  total: number;
  pending: number;
  excellent: number;
  good: number;
  improvement: number;
}

export type SupplierEvaluationDto = z.infer<typeof SupplierEvaluationSchema>;
export type EvaluationScoreDto = z.infer<typeof EvaluationScoreSchema>;
