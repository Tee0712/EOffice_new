import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AnnouncementPriority } from '../entities/announcement.entity';
import { TargetType } from '../entities/announcement-target.entity';
import { AttachmentType } from '../entities/announcement-attachment.entity';

export class TargetDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsEnum(TargetType)
  targetType: TargetType;

  @IsString()
  targetId: string;
}

export class AttachmentDto {
  @IsString()
  fileUrl: string;

  @IsString()
  fileName: string;

  @IsEnum(AttachmentType)
  @IsOptional()
  type?: AttachmentType;
}

export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsEnum(AnnouncementPriority)
  @IsOptional()
  priority?: AnnouncementPriority;

  @IsOptional()
  @Type(() => Date)
  scheduledAt?: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TargetDto)
  @IsOptional()
  targets?: TargetDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @IsOptional()
  attachments?: AttachmentDto[];

  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  allowComment?: boolean;

  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  requireConfirmation?: boolean;

  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  requireConfirm?: boolean;

  @IsString()
  @IsOptional()
  category?: string;
}
