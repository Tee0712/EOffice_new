import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Max,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsNotEmpty,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class InventoryFilterDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }) => value === '' ? undefined : value)
  keyword?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }) => value === '' ? undefined : value)
  category?: string;

  @ApiProperty({ required: false, enum: ['ENOUGH', 'LOW', 'OUT', 'all'] })
  @IsEnum(['ENOUGH', 'LOW', 'OUT', 'all'])
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  stockStatus?: string;

  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  size?: number = 20;

  @ApiProperty({ required: false, default: 20 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number; // Alias for size, common in some UIs
}

export class ImportInventoryDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  @IsNumber()
  productId: number;

  @ApiProperty({ description: 'Số lượng nhập' })
  @IsNumber()
  @Min(0.01)
  @Max(500)
  quantity: number;

  @ApiProperty({ description: 'Ngày nhập kho (yyyy-MM-dd)' })
  @IsString()
  transactionDate: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(100, { message: 'Không được vượt quá 100 ký tự' })
  @IsOptional()
  supplier?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(100, { message: 'Không được vượt quá 100 ký tự' })
  @IsOptional()
  invoiceNo?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(100, { message: 'Không được vượt quá 100 ký tự' })
  @IsOptional()
  note?: string;
}

export class IssueRequestItemDto {
  @ApiProperty()
  @IsNumber()
  product_id: number;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  requested_quantity: number;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(100, { message: 'Không được vượt quá 100 ký tự' })
  @IsOptional()
  note?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  unit_price?: number;
}

export class CreateIssueRequestDto {
  @ApiProperty({ default: 'SUBMIT' })
  @IsString()
  action: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ default: 'Bình thường' })
  @IsString()
  priority: string;

  @ApiProperty()
  @IsString()
  need_date: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500, { message: 'Không được vượt quá 500 ký tự' })
  reason: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  status?: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  approver?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  requester_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  requester_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  requester_username?: string;

  @ApiProperty({ required: false, description: 'Base64 image string for signature' })
  @IsString()
  @IsOptional()
  signature?: string;

  @ApiProperty({ type: [IssueRequestItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssueRequestItemDto)
  items: IssueRequestItemDto[];
}

export class ConfirmIssueItemDto {
  @ApiProperty()
  @IsNumber()
  product_id: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  actual_quantity: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_finished?: boolean;
}

export class ConfirmIssueDto {
  @ApiProperty({ description: 'Base64 image string or URL for signature' })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({ type: [ConfirmIssueItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConfirmIssueItemDto)
  items: ConfirmIssueItemDto[];
}

export class ApproveIssueRequestDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  status: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(100, { message: 'Không được vượt quá 100 ký tự' })
  @IsOptional()
  comment?: string;
}

export class GoodsIssueFilterDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }) => value === '' ? undefined : value)
  status?: string;

  @ApiProperty({ required: false, description: "Mức ưu tiên (vd: 'Bình thường' | 'Khẩn')" })
  @IsString()
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }) => value === '' ? undefined : value)
  priority?: string;

  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 15 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 15;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  requester_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  approver?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fromDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  toDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === '1' || value === true || value === 1)
  @IsBoolean()
  is_distribution?: boolean;
}
