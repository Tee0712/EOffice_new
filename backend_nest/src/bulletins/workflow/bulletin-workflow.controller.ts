import { Controller, Get, Post, Put, Body, Param, Query, Request } from '@nestjs/common';
import { BulletinWorkflowService } from './bulletin-workflow.service';
import { CreateBulletinDto } from './dto/create-bulletin.dto';

@Controller('v1')
export class BulletinWorkflowController {
  constructor(private readonly workflowService: BulletinWorkflowService) { }

  @Get('bulletins')
  findAll(
    @Request() req: any,
    @Query('department_id') departmentId?: string,
    @Query('status') status?: string,
    @Query('bulletin_type') bulletinType?: string,
    @Query('keyword') keyword?: string,
  ) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    const isAdmin = req.user?.roles?.includes('ADMIN') || false;
    return this.workflowService.findAll(userId, isAdmin, {
      department_id: departmentId,
      status,
      bulletin_type: bulletinType,
      keyword,
    });
  }

  @Get('bulletins/:id')
  findOne(@Param('id') id: string) {
    return this.workflowService.findOne(id);
  }

  @Post('bulletins')
  create(@Request() req: any, @Body() dto: CreateBulletinDto) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.workflowService.create(userId, dto);
  }

  @Put('bulletins/:id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: CreateBulletinDto) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.workflowService.update(id, userId, dto);
  }

  @Post('bulletins/:id/submit')
  submit(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.workflowService.submit(id, userId);
  }

  @Post('bulletins/:id/approve')
  approve(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.workflowService.approve(id, userId);
  }

  @Post('bulletins/:id/reject')
  reject(@Param('id') id: string, @Request() req: any, @Body('comment') comment: string) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.workflowService.reject(id, userId, comment);
  }

  @Post('bulletins/:id/publish')
  publish(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.workflowService.publish(id, userId);
  }

  @Post('bulletins/:id/unpublish')
  unpublish(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.workflowService.unpublish(id, userId);
  }

  @Post('bulletins/:id/delete')
  deleteBulletin(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.workflowService.delete(id, userId);
  }

  @Post('bulletins/:id/view')
  increaseViewCount(@Param('id') id: string) {
    return this.workflowService.increaseViewCount(id);
  }

  @Get('bulletins/:id/histories')
  async getHistories(@Param('id') id: string) {
    const bulletin = await this.workflowService.findOne(id);
    return bulletin.histories;
  }

  // Workflow Config
  @Get('departments/:departmentId/workflows')
  getWorkflows(@Param('departmentId') departmentId: string) {
    return this.workflowService.getWorkflows(departmentId);
  }

  @Put('departments/:departmentId/workflows')
  updateWorkflow(
    @Param('departmentId') departmentId: string,
    @Body() steps: any[]
  ) {
    return this.workflowService.updateWorkflow(departmentId, steps);
  }
}
