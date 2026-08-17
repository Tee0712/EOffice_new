import { z } from 'zod';

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

// From old meal.dto.ts
export const MealCheckinSchema = z.object({
  user_id: z.string().min(1),
  menu_id: z.number().int().positive(),
  menu_item_id: z.number().int().positive().optional().nullable(),
  registration_id: z.number().int().positive().optional().nullable(),
  method: z.enum(['qr', 'card', 'manual']).default('manual'),
  note: z.string().max(255).optional().nullable(),
});

export const UpdateCheckinStatusSchema = z.object({
  status: z.enum(['checked', 'absent', 'pending']),
  registration_id: z.coerce.number().int().positive(),
  note: z.string().max(255).optional().nullable(),
});

export type CheckInDto = z.infer<typeof CheckInSchema>;
export type ActualServingDto = z.infer<typeof ActualServingSchema>;
export type MealCheckinDto = z.infer<typeof MealCheckinSchema>;
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
