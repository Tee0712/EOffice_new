import { IsString, IsOptional, IsDateString, IsInt, IsBoolean, IsArray, ValidateNested, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventProgramDto {
  @IsInt()
  orderNo: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  presenter?: string;
}

export class CreateEventDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDatetime: string;

  @IsDateString()
  endDatetime: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  locationDetail?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxTotalGuests?: number;

  @IsOptional()
  @IsDateString()
  confirmationDeadline?: string;

  @IsOptional()
  @IsDateString()
  guestRegDeadline?: string;

  @IsOptional()
  @IsBoolean()
  allowGuestReg?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventProgramDto)
  programs?: CreateEventProgramDto[];
}
