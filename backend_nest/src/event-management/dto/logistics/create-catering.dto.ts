import { IsString, IsOptional, IsDateString, IsInt, IsEnum, Min } from 'class-validator';
import { MealType } from '../../entities/event-catering.entity';

export class CreateCateringDto {
  @IsOptional()
  @IsEnum(MealType)
  mealType?: MealType;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsDateString()
  mealTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  paxCount?: number;

  @IsOptional()
  @IsString()
  menuDescription?: string;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
