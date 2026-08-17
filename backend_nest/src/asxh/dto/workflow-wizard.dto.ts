import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class Step2RoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  roleCode: string;

  @IsArray()
  @IsOptional()
  groupIds: string[];
}

class Step3WorkflowDto {
  @IsInt()
  stepOrder: number;

  @IsString()
  @IsNotEmpty()
  roleCode: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class SaveWorkflowWizardDto {
  // Step 1
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  processKey: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Step 2
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Step2RoleDto)
  roles: Step2RoleDto[];

  // Step 3
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Step3WorkflowDto)
  steps: Step3WorkflowDto[];
}
