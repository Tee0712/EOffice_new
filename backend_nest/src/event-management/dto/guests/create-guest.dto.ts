import { IsString, IsOptional, IsEmail, IsEnum, IsBoolean } from 'class-validator';
import { GuestType } from '../../entities/event-guest.entity';

export class CreateGuestDto {
  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsEnum(GuestType)
  guestType: GuestType;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsBoolean()
  forceAdd?: boolean;
}
