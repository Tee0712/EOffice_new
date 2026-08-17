import { IsString, IsOptional, IsDateString, IsInt, Min } from 'class-validator';

export class CreateHotelDto {
  @IsOptional()
  @IsString()
  guestId?: string;

  @IsString()
  hotelName: string;

  @IsOptional()
  @IsString()
  roomType?: string;

  @IsOptional()
  @IsDateString()
  checkinDate?: string;

  @IsOptional()
  @IsDateString()
  checkoutDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  roomCount?: number;

  @IsOptional()
  @IsString()
  bookingRef?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
