import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { z } from 'zod';

export const HandoverContextQuerySchema = z.object({
  selectable_statuses: z.string().optional().default('PURCHASED'),
});

export type HandoverContextQueryDto = z.infer<typeof HandoverContextQuerySchema>;

export const HandoverListingQuerySchema = z.object({
  keyword: z.string().optional(),
  page: z.preprocess((val) => Number(val ?? 1), z.number().min(1)).default(1),
  limit: z.preprocess((val) => Number(val ?? 20), z.number().min(1)).default(20),
});

export class HandoverListingQueryDto {
  @Allow()
  @ApiPropertyOptional({ example: '' })
  keyword?: string;

  @Allow()
  @ApiPropertyOptional({ example: 1 })
  page?: number;

  @Allow()
  @ApiPropertyOptional({ example: 20 })
  limit?: number;
}

export const CreateHandoverSchema = z.object({
  event_name: z.string().optional(),
  handover_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  event_type: z.string().optional(),
  format: z.string().optional(),
  notes: z.string().optional(),
  representative_name: z.string().optional(),
  representative_title: z.string().optional(),
  representative_phone: z.string().optional(),
  representative_email: z.string().optional(),
  receiver_name: z.string().optional(),
  receiver_title: z.string().optional(),
  receiver_phone: z.string().optional(),
  receiver_email: z.string().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'WAITING_PURCHASE', 'WAITING_HANDOVER']).default('DRAFT'),
  asset_ids: z.array(z.number().int()).min(1, 'Vui lòng chọn ít nhất một hiện vật để bàn giao'),
  attendees: z.array(z.object({
    user_id: z.preprocess((val) => (typeof val === 'number' ? String(val) : val), z.string().min(1, 'Vui lòng chọn nhân sự tham gia')),
    role: z.string().optional(),
  })).optional(),
  checklists: z.array(z.object({
    name: z.string().min(1),
    checklist_type: z.enum(['REQUIRED', 'OPTIONAL', 'MANDATORY', 'Bắt buộc', 'Mở rộng']).default('OPTIONAL'),
    is_done: z.boolean().optional().default(false),
  })).optional(),
  checklist: z.array(z.object({
    name: z.string().min(1),
    checklist_type: z.enum(['REQUIRED', 'OPTIONAL', 'MANDATORY', 'Bắt buộc', 'Mở rộng']).default('OPTIONAL'),
    is_done: z.boolean().optional().default(false),
  })).optional(),
}).transform((data: any) => {
  const finalData = { ...data };
  finalData.representative_name = data.receiver_name || data.representative_name;
  finalData.representative_title = data.receiver_title || data.representative_title;
  finalData.representative_phone = data.receiver_phone || data.representative_phone;
  finalData.representative_email = data.receiver_email || data.representative_email;
  finalData.checklist = data.checklist || data.checklists;
  return finalData;
});

export class HandoverAttendeeDto {
  @Allow()
  @ApiProperty({ example: 'admin' })
  user_id: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Trưởng đoàn' })
  role?: string;
}

export class HandoverChecklistDto {
  @Allow()
  @ApiProperty({ example: 'Kiểm tra hàng hóa' })
  name: string;

  @Allow()
  @ApiPropertyOptional({ enum: ['REQUIRED', 'OPTIONAL', 'MANDATORY', 'Bắt buộc', 'Mở rộng'] })
  checklist_type?: string;

  @Allow()
  @ApiPropertyOptional({ example: false })
  is_done?: boolean;
}

export class CreateHandoverDto {
  @Allow()
  @ApiProperty({ example: 'Lễ bàn giao đợt 1' })
  event_name: string;

  @Allow()
  @ApiPropertyOptional({ example: '2026-04-15' })
  handover_date?: string;

  @Allow()
  @ApiPropertyOptional({ example: '08:00' })
  start_time?: string;

  @Allow()
  @ApiPropertyOptional({ example: '10:00' })
  end_time?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Trường THCS Kon Tum' })
  location?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'HANDOVER' })
  event_type?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'DIRECT' })
  format?: string;

  @Allow()
  @ApiPropertyOptional()
  notes?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  representative_name?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Chủ tịch' })
  representative_title?: string;

  @Allow()
  @ApiPropertyOptional()
  representative_phone?: string;

  @Allow()
  @ApiPropertyOptional()
  representative_email?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  receiver_name?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Chủ tịch' })
  receiver_title?: string;

  @Allow()
  @ApiPropertyOptional()
  receiver_phone?: string;

  @Allow()
  @ApiPropertyOptional()
  receiver_email?: string;

  @Allow()
  @ApiPropertyOptional({ default: 'DRAFT' })
  status?: string;

  @Allow()
  @ApiProperty({ type: [Number], example: [1, 2, 3] })
  asset_ids: number[];

  @Allow()
  @ApiPropertyOptional({ type: [HandoverAttendeeDto] })
  attendees?: HandoverAttendeeDto[];

  @Allow()
  @ApiPropertyOptional({ type: [HandoverChecklistDto] })
  checklist?: HandoverChecklistDto[];

  @Allow()
  @ApiPropertyOptional({ type: [HandoverChecklistDto] })
  checklists?: HandoverChecklistDto[];
}

export class UpdateHandoverDto extends CreateHandoverDto {}
export const UpdateHandoverSchema = CreateHandoverSchema;

export const HandoverChecklistUpdateSchema = z.object({
  is_done: z.boolean(),
});

export const UpdateHandoverStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SCHEDULED', 'WAITING_PURCHASE', 'WAITING_HANDOVER']),
});

export class UpdateHandoverStatusDto {
  @Allow()
  @ApiProperty({ enum: ['DRAFT', 'SCHEDULED', 'WAITING_PURCHASE', 'WAITING_HANDOVER'] })
  status: string;
}
