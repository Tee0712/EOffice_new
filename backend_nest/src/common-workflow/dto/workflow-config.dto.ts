import { IsString, IsArray, IsOptional, IsInt, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class WorkflowStepDto {
  @ApiProperty({ description: 'Thứ tự bước (1, 2, 3...)' })
  @IsInt()
  stepOrder: number;

  @ApiProperty({ description: 'ID người duyệt (User ID)' })
  @IsString()
  @IsNotEmpty()
  approverId: string;

  @ApiProperty({ description: 'Loại người duyệt (Mặc định: USER)', default: 'USER' })
  @IsOptional()
  @IsString()
  approverType?: string;
}

export class SaveWorkflowDto {
  @ApiProperty({ description: 'ID phòng ban đang được cấu hình' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({ description: 'Loại module (Mặc định: VPP)', default: 'VPP' })
  @IsOptional()
  @IsString()
  moduleType?: string;

  @ApiProperty({ description: 'Danh sách các bước phê duyệt', type: [WorkflowStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];
}
