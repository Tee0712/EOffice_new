import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CatalogFilterDto {
  @ApiProperty({ required: false, description: 'Tìm theo tên hoặc mã' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  keyword?: string;

  @ApiProperty({ required: false, description: 'Lọc theo nhóm hàng' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  category?: string;

  @ApiProperty({ required: false, enum: ['active', 'hidden', 'all'], description: 'Trạng thái' })
  @IsEnum(['active', 'hidden', 'all', 'ACTIVE', 'HIDDEN', 'ALL'])
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase() : value)
  @Transform(({ value }) => value === '' ? undefined : value)
  status?: string;

  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 20;
}

export class CreateProductDto {
  @ApiProperty({ required: false, description: 'Mã sku' })
  @IsString()
  @MaxLength(100, { message: 'Không được vượt quá 100 ký tự' })
  @IsOptional()
  sku?: string;

  @ApiProperty({ description: 'Tên mặt hàng', example: 'Bút bi Thiên Long TL-027' })
  @IsString()
  @MaxLength(100, { message: 'Không được vượt quá 100 ký tự' })
  name: string;

  @ApiProperty({ description: 'Nhóm hàng', example: 'Bút viết' })
  @IsString()
  @MaxLength(100, { message: 'Không được vượt quá 100 ký tự' })
  categoryId: string;

  @ApiProperty({ description: 'Đơn vị tính', example: 'Cây' })
  @IsString()
  @MaxLength(100, { message: 'Không được vượt quá 100 ký tự' })
  unit: string;

  @ApiProperty({ required: false, description: 'Giá tham khảo' })
  @IsNumber()
  @Min(0, { message: 'Giá tham khảo không được nhỏ hơn 0' })
  @IsOptional()
  reference_price?: number;

  @ApiProperty({ required: false, description: 'Đường dẫn ảnh' })
  @IsOptional()
  image?: string;

  @ApiProperty({ required: false, description: 'Base64 image hoặc url' })
  @IsOptional()
  imageurl?: string;

  @ApiProperty({ required: false, description: 'Base64 image hoặc url fallback' })
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ required: false, description: 'Base64 image hoặc url fallback' })
  @IsOptional()
  image_url?: string;

  @ApiProperty({ required: false, description: 'Ghi chú' })
  @IsString()
  @MaxLength(100, { message: 'Không được vượt quá 100 ký tự' })
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(50, { message: 'Không được vượt quá 50 ký tự' })
  @IsOptional()
  quotaValue?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(50, { message: 'Không được vượt quá 50 ký tự' })
  @IsOptional()
  quotaUnit?: string;
}

export class UpdateProductDto extends CreateProductDto {}
