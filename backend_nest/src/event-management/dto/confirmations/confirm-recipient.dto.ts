import { IsEnum, IsInt, IsOptional, IsString, Min, ValidateIf } from 'class-validator';
import { ConfirmationStatus } from '../../entities/notification-confirmation.entity';

export class ConfirmRecipientDto {
  @IsEnum(ConfirmationStatus)
  status: ConfirmationStatus;

  @ValidateIf((o) => o.status === ConfirmationStatus.CONFIRMED)
  @IsInt()
  @Min(0)
  attendeeCount?: number;

  @ValidateIf((o) => o.status === ConfirmationStatus.DECLINED)
  @IsString()
  declineReason?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
