import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProgramDto {
  @ApiProperty({ example: 'Bang_tien', enum: ['Bang_tien', 'Hien_vat', 'Giao_duc'] })
  @IsEnum(['Bang_tien', 'Hien_vat', 'Giao_duc'])
  funding_type: string;

  @ApiProperty({ example: 'PRG-2023-0001', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'Chương trình hỗ trợ trẻ em nghèo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Mô tả chi tiết...', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Hà Nội' })
  @IsString()
  @IsNotEmpty()
  locality: string;

  @ApiProperty({ example: 'số 1...', required: false })
  @IsString()
  @IsOptional()
  specific_address?: string;

  @ApiProperty({ example: '2023-10-01', required: false })
  @IsOptional()
  start_date?: string;

  @ApiProperty({ example: '2023-12-31', required: false })
  @IsOptional()
  end_date?: string;

  @ApiProperty({ example: 'UBND', required: false })
  @IsString()
  @IsOptional()
  local_partner?: string;

  @ApiProperty({ example: 'Nghèo', required: false })
  @IsString()
  @IsOptional()
  beneficiary?: string;

  @ApiProperty({ example: 'tag1,tag2', required: false })
  @IsString()
  @IsOptional()
  classification_keywords?: string;

  @ApiProperty({ example: 'Ngân sách', required: false })
  @IsString()
  @IsOptional()
  funding_source?: string;

  @ApiProperty({ example: 100000000 })
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiProperty({ example: 'Phòng Kế hoạch', required: false })
  @IsString()
  @IsOptional()
  lead_department?: string;

  @ApiProperty({ example: [1, 2], required: false })
  @IsArray()
  @IsOptional()
  dispatch_ids?: number[];

  @ApiProperty({ 
    example: [{ document_id: 1, document_code: 'CV-2026/015', document_subject: 'Trích yếu...' }],
    required: false 
  })
  @IsArray()
  @IsOptional()
  linked_documents?: { document_id: number | string; document_code?: string; document_subject?: string }[];

  @IsArray()
  @IsOptional()
  members?: any[];

  @IsArray()
  @IsOptional()
  items?: any[];

  @IsArray()
  @IsOptional()
  milestones?: any[];

  @ApiProperty({ example: 'SUBMIT', enum: ['DRAFT', 'SUBMIT'] })
  @IsEnum(['DRAFT', 'SUBMIT'])
  @IsOptional()
  action?: string;
}
