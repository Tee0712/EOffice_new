import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BulletinPriority, BulletinType } from '../entities/bulletin.entity';

export class CreateBulletinDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsUUID()
  @IsNotEmpty()
  department_id: string;

  @IsOptional()
  @IsEnum(BulletinType)
  bulletin_type?: BulletinType;

  @IsOptional()
  @IsEnum(BulletinPriority)
  priority?: BulletinPriority;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsArray()
  attachments?: Array<{ name: string; size?: number; type?: string; url?: string }>;

  @IsOptional()
  @IsBoolean()
  auto_schedule?: boolean;

  @IsOptional()
  @IsDateString()
  scheduled_publish_at?: string;

  @IsOptional()
  @IsArray()
  viewer_department_ids?: string[];
}
