import { IsString, IsOptional, IsDateString, IsInt, Min } from 'class-validator';

export class CreateTransportDto {
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @IsOptional()
  @IsString()
  dropoffLocation?: string;

  @IsOptional()
  @IsDateString()
  pickupTime?: string;

  @IsOptional()
  @IsString()
  driverInfo?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
