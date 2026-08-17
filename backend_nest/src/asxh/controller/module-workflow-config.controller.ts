import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/oauth/jwt.guard';
import { ModuleWorkflowConfigService } from '../service/module-workflow-config.service';

@ApiTags('Module Workflow Mapping')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/module-workflow')
export class ModuleWorkflowConfigController {
  constructor(private readonly configService: ModuleWorkflowConfigService) {}

  @Get('modules')
  @ApiOperation({ summary: 'Lấy danh sách các Module (Menu cha)' })
  async getModules() {
    const data = await this.configService.getModules();
    return { success: true, data };
  }

  @Get('workflows')
  @ApiOperation({ summary: 'Lấy danh sách các Process Key từ Workflow Wizard' })
  async getWorkflows() {
    const data = await this.configService.getWorkflows();
    return { success: true, data };
  }

  @Get('mappings')
  @ApiOperation({ summary: 'Lấy các ánh xạ hiện tại' })
  async getMappings() {
    const data = await this.configService.getMappings();
    return { success: true, data };
  }

  @Post('mapping')
  @ApiOperation({ summary: 'Lưu ánh xạ cho Module' })
  async saveMapping(@Body() body: { menuId: string; workflowKey: string }) {
    const data = await this.configService.saveMapping(body.menuId, body.workflowKey);
    return { success: true, data };
  }

  @Post('delete-mapping')
  @ApiOperation({ summary: 'Xóa ánh xạ cho Module' })
  async deleteMapping(@Body() body: { menuId: string }) {
    const data = await this.configService.deleteMapping(body.menuId);
    return { success: true, data };
  }
}
