import { z } from 'zod';

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
