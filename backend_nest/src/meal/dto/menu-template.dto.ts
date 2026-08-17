import { z } from 'zod';

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

// From old meal.dto.ts
export const CreateMealTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  meal_session_ids: z.array(z.number().int().positive()).min(1),
  is_system: z.boolean().optional().default(false),
});

export type TemplateItemDto = z.infer<typeof TemplateItemSchema>;
export type CreateTemplateDto = z.infer<typeof CreateTemplateSchema>;
export type ApplyTemplateDto = z.infer<typeof ApplyTemplateSchema>;
export type CreateMealTemplateDto = z.infer<typeof CreateMealTemplateSchema>;
