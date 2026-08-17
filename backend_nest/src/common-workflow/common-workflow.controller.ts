import { Controller, Get, Post, Body, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CommonWorkflowService } from './common-workflow.service';
import { AuthorityGuard } from 'src/authority-documents';
import { SaveWorkflowDto } from './dto/workflow-config.dto';

import { VppAdminGuard } from 'src/vpp/guards/vpp-admin.guard';

@ApiTags('Approval Flow Configuration')
@Controller(['approval-flow-config', 'v1/approval-flow-config'])
@UseGuards(AuthorityGuard)
export class CommonWorkflowController {
  private readonly logger = new Logger(CommonWorkflowController.name);

  constructor(private readonly workflowService: CommonWorkflowService) {}

  @Get('module-types')
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Lay danh sach loai luong phe duyet (module_type)' })
  async getModuleTypes() {
    return this.workflowService.getModuleTypes();
  }

  @Get()
  @ApiOperation({ summary: 'Lay cau hinh luong phe duyet' })
  @ApiQuery({ name: 'departmentId', required: false, description: 'ID phong ban (khong con bat buoc)' })
  @ApiQuery({ name: 'moduleType', required: false, description: 'Loai module (VPP, ASXH...)' })
  async getWorkflows(
    @Query('departmentId') departmentId?: string,
    @Query('moduleType') moduleType?: string
  ) {
    this.logger.log(`Request: GET /approval-flow-config?moduleType=${moduleType || 'VPP'}`);
    return this.workflowService.getWorkflows(departmentId, moduleType);
  }

  @Post()
  @UseGuards(VppAdminGuard)
  @ApiOperation({ summary: 'Luu cau hinh luong phe duyet' })
  @ApiBody({ type: SaveWorkflowDto })
  async saveWorkflow(@Body() payload: SaveWorkflowDto) {
    this.logger.log(`Request: POST /approval-flow-config for department [${payload.departmentId}]`);
    return this.workflowService.saveWorkflow(payload);
  }
}

