import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProgramItemDto {
  @ApiProperty()
  @IsNumber()
  program_id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNumber()
  unit_price: number;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}
