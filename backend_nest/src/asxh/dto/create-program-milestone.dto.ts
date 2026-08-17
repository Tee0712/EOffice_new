import { IsNotEmpty, IsString, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProgramMilestoneDto {
  @ApiProperty()
  @IsNumber()
  program_id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  milestone_name: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  milestone_date: string;

  @ApiProperty({ enum: ['MANDATORY', 'OPTIONAL'] })
  @IsEnum(['MANDATORY', 'OPTIONAL'])
  milestone_type: string;
}
