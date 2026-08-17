import { IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSatisfactionSurveyDto {
  @IsString()
  @MaxLength(300)
  title: string;

  @IsString()
  question: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  allowComment?: boolean;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

