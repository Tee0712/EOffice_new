import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LogisticsType } from '../../entities/event-logistics.entity';

export class CreateLogisticsDto {
  @IsEnum(LogisticsType)
  logisticsType: LogisticsType;

  @IsOptional()
  @IsString()
  requestNote?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;
}
