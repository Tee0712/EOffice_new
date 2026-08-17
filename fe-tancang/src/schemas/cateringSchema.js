import { z } from 'zod';

export const mealEvaluationSchema = z.object({
  date: z.string().min(1, 'Vui lòng chọn ngày'),
  mealSlot: z.string().min(1, 'Vui lòng chọn bữa ăn'),
  supplierId: z.number({ required_error: 'Vui lòng chọn nhà cung cấp' }).min(1, 'Vui lòng chọn nhà cung cấp'),
  scores: z.object({
    taste: z.number().min(1, 'Vui lòng đánh giá').max(5),
    hygiene: z.number().min(1, 'Vui lòng đánh giá').max(5),
    portion: z.number().min(1, 'Vui lòng đánh giá').max(5),
    diversity: z.number().min(1, 'Vui lòng đánh giá').max(5),
    service: z.number().min(1, 'Vui lòng đánh giá').max(5),
  }),
  comment: z.string().max(500, 'Nhận xét không quá 500 ký tự').optional(),
  images: z.array(z.string()).optional(),
});

