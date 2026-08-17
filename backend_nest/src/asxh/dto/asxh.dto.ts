import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow, IsNotEmpty, IsOptional } from 'class-validator';
import { z } from 'zod';

export const DisbursementStatusEnum = z.enum(['COMPLETED', 'DISBURSED', 'APPROVED', 'PENDING_APPROVAL', 'REJECTED', 'DRAFT']);

export const DisbursementOverviewQuerySchema = z.object({
  keyword: z.string().optional(),
  status: DisbursementStatusEnum.optional(),
  sort: z.string().optional().default('expected_transfer_date_desc'),
  page: z.preprocess((val) => Number(val ?? 1), z.number().min(1)).default(1),
  limit: z.preprocess((val) => Number(val ?? 20), z.number().min(1)).default(20),
});

export type DisbursementOverviewQueryDto = z.infer<typeof DisbursementOverviewQuerySchema>;

export class CreateReceiverDto {
  @ApiProperty({ example: 'Công ty TNHH MTV ABC' })
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '0101234567' })
  @IsOptional()
  tax_code?: string;

  @ApiProperty({ example: 'Vietcombank' })
  @IsNotEmpty()
  bank_name: string;

  @ApiProperty({ example: '0011001234567' })
  @IsNotEmpty()
  bank_account_number: string;

  @ApiPropertyOptional({ example: 'Chi nhánh Hà Nội' })
  @IsOptional()
  bank_branch?: string;

  @ApiProperty({ example: 'NGUYEN VAN A' })
  @IsNotEmpty()
  bank_account_holder: string;
}

export const DisbursementTimelineQuerySchema = z.object({
  status: DisbursementStatusEnum.optional(),
  from_date: z.string().optional(), // ISO date string
  to_date: z.string().optional(),
  sort: z.string().optional().default('expected_transfer_date_desc'),
});

export type DisbursementTimelineQueryDto = z.infer<typeof DisbursementTimelineQuerySchema>;

export const UploadAttachmentSchema = z.object({
  title: z.union([z.string(), z.array(z.string())]).optional(),
  doc_type: z.union([z.string(), z.array(z.string())]).optional(),
});

export type UploadAttachmentDto = z.infer<typeof UploadAttachmentSchema>;

export const ConfirmSubmitSchema = z.preprocess(
  (val) => (val === null || val === undefined || val === '' ? {} : val),
  z.object({
    note: z.string().optional(),
    require_min_attachments: z.boolean().optional().default(true),
    min_attachments: z.number().int().optional().default(1),
    require_doc_types: z.array(z.string()).optional().default([]),
    notify_approver: z.boolean().optional().default(false),
    notify_receiver: z.boolean().optional().default(false),
  }),
).default({
  require_min_attachments: true,
  min_attachments: 1,
  require_doc_types: [],
  notify_approver: false,
  notify_receiver: false,
});

export type ConfirmSubmitDto = z.infer<typeof ConfirmSubmitSchema>;

export const SearchReceiversQuerySchema = z.object({
  keyword: z.string().optional(),
  page: z.preprocess((val) => Number(val ?? 1), z.number().min(1)).default(1),
  limit: z.preprocess((val) => Number(val ?? 20), z.number().min(1)).default(20),
});
export type SearchReceiversQueryDto = z.infer<typeof SearchReceiversQuerySchema>;

export const CreateReceiverSchema = z.object({
  name: z.string().min(1, 'Tên đơn vị là bắt buộc'),
  tax_code: z.string().optional(),
  bank_name: z.string().min(1, 'Ngân hàng là bắt buộc'),
  bank_account_number: z.string().min(1, 'Số tài khoản là bắt buộc'),
  bank_branch: z.string().optional(),
  bank_account_holder: z.string().min(1, 'Chủ tài khoản là bắt buộc'),
});
export type CreateReceiverDtoOld = z.infer<typeof CreateReceiverSchema>;

export const BudgetCheckSchema = z.object({
  current_disbursement_id: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
  details: z.array(z.object({
    amount: z.number().positive(),
  })).min(1, 'Cần ít nhất một khoản chi'),
});
export class BudgetCheckDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  current_disbursement_id?: number;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 50000000 }
      }
    }
  })
  @Allow()
  details: { amount: number }[];
}

export const CreateDisbursementSchema = z.preprocess(
  (val: any) => {
    if (val && !val.details && val.amount_details) {
      val.details = val.amount_details;
    }
    if (val && Array.isArray(val.details)) {
      val.details = val.details.map((d: any) => ({
        ...d,
        amount: typeof d.amount === 'string' ? parseFloat(d.amount) : d.amount,
      }));
    }
    return val;
  },
  z.object({
    program_item_id: z.preprocess((val) => Number(val), z.number().int()),
    disbursement_content: z.string().optional(),
    detailed_description: z.string().optional(),
    expected_transfer_date: z.string().optional(), // ISO date string
    receiver_id: z.preprocess((val) => (val === null || val === undefined ? undefined : Number(val)), z.number().int().optional().nullable()),
    notification_type: z.string().optional(),
    status: z.string().optional(),
    details: z.array(z.object({
      expense_content: z.string().optional(),
      amount: z.preprocess((val) => Number(val), z.number().positive('Số tiền phải lớn hơn 0')),
    }).passthrough()).min(1, 'Cần ít nhất một khoản chi'),
    amount_details: z.array(z.object({
      expense_content: z.string().optional(),
      amount: z.preprocess((val) => Number(val), z.number().positive('Số tiền phải lớn hơn 0')),
    }).passthrough()).optional(),
    // Additional fields sent by frontend but not strictly required for logic
    receiving_unit: z.string().optional(),
    bank_account_number: z.string().optional(),
    bank_name: z.string().optional(),
    account_holder: z.string().optional(),
    tax_code: z.string().optional(),
    bank_branch: z.string().optional(),
    send_email_notification: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
    auto_reminder: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
    workflow_key: z.string().optional(),
    workflowKey: z.string().optional(),
    is_submit: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
    isSubmit: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  }),
);

export class CreateDisbursementDto {
  @ApiPropertyOptional({ example: 'DRAFT' })
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 11 })
  @Allow()
  program_item_id: number;

  @ApiProperty({ example: 'Đợt 3 – Thi công đường liên ấp' })
  @IsNotEmpty()
  disbursement_content: string;

  @ApiPropertyOptional({ example: 'Thanh toán đợt 1...' })
  @IsOptional()
  detailed_description?: string;

  @ApiProperty({ example: '2026-03-25' })
  @IsNotEmpty()
  expected_transfer_date: string;

  @ApiProperty({ example: 1 })
  @Allow()
  receiver_id: number;

  @ApiPropertyOptional({ example: 'EMAIL' })
  @IsOptional()
  notification_type?: string;

  @ApiPropertyOptional({ example: 'Công ty TNHH MTV ABC' })
  @IsOptional()
  receiving_unit?: string;

  @ApiPropertyOptional({ example: '0011001234567' })
  @IsOptional()
  bank_account_number?: string;

  @ApiPropertyOptional({ example: 'Vietcombank' })
  @IsOptional()
  bank_name?: string;

  @ApiPropertyOptional({ example: 'Chi nhánh Hà Nội' })
  @IsOptional()
  bank_branch?: string;

  @ApiPropertyOptional({ example: 'NGUYEN VAN A' })
  @IsOptional()
  account_holder?: string;

  @ApiPropertyOptional({ example: '0101234567' })
  @IsOptional()
  tax_code?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  send_email_notification?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  auto_reminder?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  is_submit?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isSubmit?: boolean;

  @ApiPropertyOptional({ example: 'asxh_disbursement_flow' })
  @IsOptional()
  workflowKey?: string;

  @ApiPropertyOptional({ example: 'asxh_disbursement_flow' })
  @IsOptional()
  workflow_key?: string;
  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        expense_content: { type: 'string', example: 'Vật liệu xây dựng' },
        amount: { type: 'number', example: 180000000 }
      }
    }
  })
  @Allow()
  details: { expense_content: string; amount: number }[];

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        expense_content: { type: 'string', example: 'Vật liệu xây dựng' },
        amount: { type: 'string', example: '180000000' }
      }
    }
  })
  @IsOptional()
  amount_details?: { expense_content: string; amount: string | number }[];
}

export class UpdateDisbursementDto extends CreateDisbursementDto { }
export const UpdateDisbursementSchema = CreateDisbursementSchema;

export const UpdateDisbursementStatusSchema = z.object({
  status: z.string().min(1, 'Trạng thái là bắt buộc'),
  note: z.string().optional(),
});
export class UpdateDisbursementStatusDto {
  @ApiProperty({ example: 'COMPLETED' })
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({ example: 'Đã hoàn tất thanh toán' })
  @IsOptional()
  note?: string;
}

export const ClassifyAttachmentSchema = z.object({
  doc_type: z.string().min(1, 'Loại chứng từ là bắt buộc'),
});
export class ClassifyAttachmentDto {
  @ApiProperty({ example: 'BANG_KE' })
  @IsNotEmpty()
  doc_type: string;
}

// --- NEW PROGRAM SCHEMAS ---

export const ProgramItemSchema = z.object({
  program_id: z.preprocess((val) => Number(val), z.number().int()).optional(),
  name: z.string().min(1, 'Tên hạng mục là bắt buộc'),
  unit_price: z.preprocess((val) => Number(val), z.number().min(0)),
  quantity: z.preprocess((val) => Number(val), z.number().int().min(1)),
});

export type CreateProgramItemDto = z.infer<typeof ProgramItemSchema>;

export const ProgramMilestoneSchema = z.object({
  program_id: z.preprocess((val) => Number(val), z.number().int()).optional(),
  milestone_name: z.string().min(1, 'Tên mốc là bắt buộc'),
  milestone_date: z.string().min(1, 'Ngày mốc là bắt buộc'),
  milestone_type: z.enum(['MANDATORY', 'OPTIONAL']).default('MANDATORY'),
});

export type CreateProgramMilestoneDto = z.infer<typeof ProgramMilestoneSchema>;

export const ProgramMemberSchema = z.object({
  program_id: z.preprocess((val) => Number(val), z.number().int()).optional(),
  user_id: z.preprocess((val) => (typeof val === 'string' ? val : String(val)), z.string().min(1)),
  role: z.enum(['LEADER', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

export type CreateProgramMemberDto = z.infer<typeof ProgramMemberSchema>;

export const CreateProgramBaseSchema = z.object({
  funding_type: z.enum(['Bang_tien', 'Hien_vat', 'Giao_duc']),
  code: z.string().min(1, 'Mã chương trình là bắt buộc'),
  name: z.string().min(5, 'Tên chương trình phải từ 5 ký tự'),
  description: z.string().optional(),
  locality: z.string().min(1, 'Vui lòng chọn địa phương'),
  specific_address: z.string().optional(),
  start_date: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  end_date: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
  local_partner: z.string().optional(),
  beneficiary: z.string().optional(),
  beneficiary_count: z.preprocess((val) => Number(val || 0), z.number().int().min(0)).optional(),
  classification_keywords: z.string().optional(),
  funding_source: z.string().optional(),
  budget: z.preprocess((val) => Number(val || 0), z.number().min(0)).optional(),
  lead_department: z.string().optional(),
  dispatch_ids: z.array(z.number()).optional(),
  linked_documents: z.array(z.object({
    document_id: z.number(),
    document_code: z.string().optional(),
    document_subject: z.string().optional(),
  })).optional(),
  action: z.enum(['DRAFT', 'SUBMIT']).optional().default('DRAFT'),
});

export const CreateProgramSchema = CreateProgramBaseSchema.refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date);
  }
  return true;
}, {
  message: 'Ngày kết thúc phải sau ngày bắt đầu',
  path: ['end_date'],
});

export type ProgramDto = z.infer<typeof CreateProgramSchema>;

export const UpdateProgramSchema = CreateProgramBaseSchema.partial().extend({
  id: z.preprocess((val) => Number(val), z.number().int()),
});

export type UpdateProgramDto = z.infer<typeof UpdateProgramSchema>;
