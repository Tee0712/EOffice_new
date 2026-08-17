import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { z } from 'zod';

export const UserSearchQuerySchema = z.object({
  keyword: z.string().optional(),
  page: z.preprocess((val) => Number(val ?? 1), z.number().min(1)).default(1),
  limit: z.preprocess((val) => Number(val ?? 20), z.number().min(1)).default(20),
});

export class UserSearchQueryDto {
  @Allow()
  @ApiPropertyOptional({ example: 'admin' })
  keyword?: string;

  @Allow()
  @ApiPropertyOptional({ example: 1 })
  page?: number;

  @Allow()
  @ApiPropertyOptional({ example: 20 })
  limit?: number;
}

export class UserSimpleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  username: string;
  
  @ApiPropertyOptional()
  fullName?: string | null;

  @ApiPropertyOptional()
  position?: string;

  @ApiPropertyOptional()
  organization_name?: string | null;
}
