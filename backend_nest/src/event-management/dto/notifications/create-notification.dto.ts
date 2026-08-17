import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, IsArray, ValidateNested, Min, ArrayMinSize, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { SendType } from '../../entities/event-notification.entity';

export class RecipientDto {
  @IsString()
  departmentId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxGuests?: number;

  @IsOptional()
  @IsBoolean()
  isRelatedFunction?: boolean;
}

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(SendType)
  sendType: SendType;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  reminderDaysBefore?: number;

  @IsOptional()
  @IsDateString()
  confirmationDeadline?: string;

  @IsOptional()
  @IsBoolean()
  allowGuestReg?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxTotalGuests?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  recipients: RecipientDto[];
}
