import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { z } from 'zod';

export const CreateSupplierSchema = z.object({
  name: z.string().trim().min(2, 'Tên nhà cung cấp quá ngắn (tối thiểu 2 ký tự)').max(500, 'Tên nhà cung cấp quá dài'),
  tax_code: z.string().trim().min(1, 'Mã số thuế là bắt buộc').regex(/^[0-9A-Z-]+$/, 'Mã số thuế chỉ được chứa số, chữ in hoa và dấu gạch ngang'),
  address: z.string().trim().min(5, 'Địa chỉ quá ngắn (tối thiểu 5 ký tự)').max(1000, 'Địa chỉ quá dài'),
  phone: z.string().trim().regex(/^[0-9]{10}$/, 'Số điện thoại phải có đúng 10 chữ số'),
  email: z.string().trim().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  contact_person: z.string().trim().min(2, 'Người liên hệ là bắt buộc').max(200, 'Tên người liên hệ quá dài'),
  notes: z.string().trim().min(1, 'Mã định danh là bắt buộc'),
  supplier_type: z.string().trim().min(1, 'Loại hình NCC là bắt buộc').max(100, 'Loại hình nhà cung cấp quá dài'),
});

export class CreateSupplierDto {
  @Allow()
  @ApiProperty({ example: 'Cty TNHH Phú Vinh Technology' })
  name: string;

  @Allow()
  @ApiPropertyOptional({ example: '0101234567' })
  tax_code?: string;

  @Allow()
  @ApiPropertyOptional({ example: '123 Đường ABC, Hà Nội' })
  address?: string;

  @Allow()
  @ApiPropertyOptional({ example: '0912345678' })
  phone?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'contact@phuvinh.com' })
  email?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  contact_person?: string;

  @Allow()
  @ApiPropertyOptional()
  notes?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Cung cấp thiết bị trường học' })
  supplier_type?: string;
}

export class UpdateSupplierDto extends CreateSupplierDto {}

export const SupplierListingQuerySchema = z.object({
  keyword: z.string().optional(),
  page: z.preprocess((val) => {
    const p = Number(val ?? 1);
    return Math.max(1, p);
  }, z.number().min(1)).default(1),
  limit: z.preprocess((val) => Number(val ?? 20), z.number().min(1)).default(20),
  size: z.preprocess((val) => Number(val ?? 20), z.number().min(1)).optional(),
}).transform((data) => ({
  ...data,
  limit: data.size !== undefined ? data.size : data.limit,
}));

export class SupplierListingQueryDto {
  @Allow()
  @ApiPropertyOptional()
  keyword?: string;

  @Allow()
  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @Allow()
  @ApiPropertyOptional({ default: 20 })
  limit?: number;

  @Allow()
  @ApiPropertyOptional({ default: 20 })
  size?: number;
}
