import { IsNotEmpty, IsString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProgramMemberDto {
  @ApiProperty()
  @IsNumber()
  program_id: number;

  @ApiProperty()
  @IsString()
  user_id: string;

  @ApiProperty({ enum: ['LEADER', 'MEMBER', 'VIEWER'] })
  @IsEnum(['LEADER', 'MEMBER', 'VIEWER'])
  role: string;
}
