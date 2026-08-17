import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { GuestType } from '../../entities/event-guest.entity';

export class QueryGuestDto {
  @IsOptional()
  @IsEnum(GuestType)
  guestType?: GuestType;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  page?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  size?: number = 20;
}
