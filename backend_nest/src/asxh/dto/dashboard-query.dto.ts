import { IsOptional, IsInt, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number = new Date().getFullYear();

  @IsOptional()
  @IsString()
  @IsEnum(['Q1', 'Q2', 'Q3', 'Q4', 'Năm'])
  quarter?: string;

  @IsOptional()
  @IsString()
  funding_type?: string;

  @IsOptional()
  @IsString()
  locality?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page_size?: number = 5;

  @IsOptional()
  @IsString()
  from_date?: string;

  @IsOptional()
  @IsString()
  to_date?: string;
}
