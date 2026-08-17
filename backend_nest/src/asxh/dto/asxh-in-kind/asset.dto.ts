import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { z } from 'zod';

export const AssetStatusEnum = z.enum(['RECEIVED', 'IN_PROCUREMENT', 'PURCHASED', 'SHIPPING', 'DELIVERED']);

export const AssetOverviewQuerySchema = z.object({
});
export type AssetOverviewQueryDto = z.infer<typeof AssetOverviewQuerySchema>;

export const AssetListingQuerySchema = z.object({
  keyword: z.string().optional(),
  status: z.preprocess((val) => (val === '' ? undefined : val), z.enum(['RECEIVED', 'IN_PROCUREMENT', 'PURCHASED', 'SHIPPING', 'DELIVERED']).optional()),
  page: z.preprocess((val) => (val ? parseInt(val as string, 10) : 1), z.number().int().min(1).default(1)),
  limit: z.preprocess((val) => (val ? parseInt(val as string, 10) : 10), z.number().int().min(1).default(10)),
});
export type AssetListingQueryDto = z.infer<typeof AssetListingQuerySchema>;

export const CreateAssetSpecSchema = z.object({
  id: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().optional()),
  parameter_name: z.string().optional(),
  parameterName: z.string().optional(),
  value: z.string().optional(),
  parameter_value: z.string().optional(),
  parameterValue: z.string().optional(),
}).transform((data) => {
  const final = {
    ...data,
    parameter_name: data.parameter_name || data.parameterName || '',
    value: data.value || data.parameter_value || data.parameterValue || '',
  };
  return final;
}).refine(data => data.parameter_name.length > 0, {
  message: 'Tên thông số không được để trống',
  path: ['parameter_name']
});

export class CreateAssetSpecDto {
  @Allow()
  @ApiPropertyOptional({ example: 1 })
  id?: number;

  @Allow()
  @ApiProperty({ example: 'CPU' })
  parameter_name: string;

  @Allow()
  @ApiPropertyOptional({ example: 'CPU' })
  parameterName?: string;

  @Allow()
  @ApiProperty({ example: 'Intel Core i5' })
  value: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Intel Core i5' })
  parameterValue?: string;
}

export const CreateAssetSchema = z.object({
  name: z.string().min(1, 'Tên hiện vật là bắt buộc'),
  category: z.string().min(1, 'Vui lòng chọn danh mục'),
  unit: z.string().optional().default('Chiếc'),
  description: z.string().optional(),
  unit_price: z.preprocess((val) => (val === '' || val === null ? 0 : Number(val)), z.number().min(1, 'Đơn giá phải lớn hơn 0')),
  quantity: z.preprocess((val) => (val === '' || val === null ? 1 : Number(val)), z.number().int().min(1, 'Số lượng phải lớn hơn 0')),
  required_receipt_date: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().min(1, 'Thời gian nhận hàng là bắt buộc')),
  receive_date: z.string().optional().nullable(),
  special_requirements: z.string().optional().nullable(),
  supplier: z.union([z.string(), z.number()]).optional().nullable(),
  supplier_id: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1, 'Vui lòng chọn nhà cung cấp')),
  has_official_quote: z.preprocess((val) => val === 'true' || val === true || val === 1, z.boolean().optional()).default(false),
  has_quotation: z.preprocess((val) => val === 'true' || val === true || val === 1, z.boolean().optional()).default(false),
  status: AssetStatusEnum.default('RECEIVED'),
  specifications: z.array(CreateAssetSpecSchema).optional(),
}).transform((data: any) => {
  const final = { ...data };
  
  if (final.receive_date && !final.required_receipt_date) {
    final.required_receipt_date = final.receive_date;
  }
  
  if (final.has_quotation !== undefined && final.has_official_quote === false) {
    final.has_official_quote = final.has_quotation;
  }

  if (typeof final.supplier === 'number') {
    if (!final.supplier_id) final.supplier_id = final.supplier;
    final.supplier = undefined;
  }
  
  return final;
});

export class CreateAssetDto {
  @Allow()
  @ApiProperty({ example: 'Máy tính xách tay Dell Latitude' })
  name: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Thiết bị điện tử' })
  category?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Cái' })
  unit?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Máy tính phục vụ học tập' })
  description?: string;

  @Allow()
  @ApiPropertyOptional({ example: 15000000 })
  unit_price?: number;

  @Allow()
  @ApiPropertyOptional({ example: 10 })
  quantity?: number;

  @Allow()
  @ApiPropertyOptional({ example: '2026-04-01' })
  required_receipt_date?: string;

  @Allow()
  @ApiPropertyOptional({ example: '2026-04-01' })
  receive_date?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Bảo quản nơi khô ráo' })
  special_requirements?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Công ty máy tính ABC' })
  supplier?: string;

  @Allow()
  @ApiPropertyOptional({ example: 1, description: 'ID nhà cung cấp (từ bảng asxh_suppliers)' })
  supplier_id?: number;

  @Allow()
  @ApiPropertyOptional({ example: false })
  has_official_quote?: boolean;

  @Allow()
  @ApiPropertyOptional({ example: false })
  has_quotation?: boolean;

  @Allow()
  @ApiPropertyOptional({ enum: ['RECEIVED', 'IN_PROCUREMENT', 'PURCHASED', 'SHIPPING', 'DELIVERED'] })
  status?: string;
  
  @Allow()
  @ApiPropertyOptional({ type: [CreateAssetSpecDto] })
  specifications?: CreateAssetSpecDto[];
}

export class UpdateAssetDto extends CreateAssetDto {}
export const UpdateAssetSchema = CreateAssetSchema;

export const AssetAttachmentSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  doc_type: z.string().optional(),
});

export class AssetAttachmentDto {
  @Allow()
  @ApiProperty({ example: 'Phiếu bảo hành' })
  title: string;

  @Allow()
  @ApiPropertyOptional({ example: 'WARRANTY' })
  doc_type?: string;
}

export const LinkHandoverSchema = z.object({
  handover_asset_id: z.preprocess((val) => Number(val), z.number().int()),
});

export class LinkHandoverDto {
  @Allow()
  @ApiProperty({ example: 1 })
  handover_asset_id: number;
}
