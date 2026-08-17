import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SubmitSatisfactionResponseDto {
  @IsInt()
  @Min(1)
  @Max(5)
  ratingValue: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  selectedOption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

