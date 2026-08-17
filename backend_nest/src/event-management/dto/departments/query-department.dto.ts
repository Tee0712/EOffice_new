import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class QueryDepartmentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 20;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;
}
