import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ReminderChannel } from '../../entities/reminder-log.entity';

export class RemindNotificationDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipientIds?: string[];

  @IsEnum(ReminderChannel)
  channel: ReminderChannel;
}
