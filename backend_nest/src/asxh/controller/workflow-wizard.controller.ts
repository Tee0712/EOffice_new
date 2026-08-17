import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { WorkflowWizardService } from '../service/workflow-wizard.service';
import { SaveWorkflowWizardDto } from '../dto/workflow-wizard.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('workflow-wizard')
@Controller('v1/workflow-wizard')
export class WorkflowWizardController {
  constructor(private readonly wizardService: WorkflowWizardService) {}

  @Post('save')
  @ApiOperation({ summary: 'Lưu cấu hình quy trình 3 bước (ASXH)' })
  async saveWizard(@Body() dto: SaveWorkflowWizardDto) {
    const data = await this.wizardService.saveWizard(dto);
    return { success: true, data };
  }

  @Post('find-all')
  @ApiOperation({ summary: 'Lấy danh sách các luồng quy trình' })
  async findAll() {
    const data = await this.wizardService.findAll();
    return { success: true, data };
  }

  @Post('detail')
  @ApiOperation({ summary: 'Lấy chi tiết cấu hình quy trình theo processKey' })
  async getDetail(@Body('processKey') processKey: string) {
    const data = await this.wizardService.getDetail(processKey);
    return { success: true, data };
  }

  @Post('delete')
  @ApiOperation({ summary: 'Xóa quy trình theo processKey' })
  async delete(@Body('processKey') processKey: string) {
    const data = await this.wizardService.delete(processKey);
    return { success: true, data };
  }
}
