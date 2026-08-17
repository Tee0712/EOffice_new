import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { SystemLogServiceSql } from 'src/systemLogManagement/system-log-service-sql';

@Controller('v1')
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly systemLogService: SystemLogServiceSql,
  ) { }

  private async logAction(req: any, action: 'POST' | 'PUT' | 'DELETE', details: string, type: string = 'BULLETIN_PERMISSION') {
    try {
      const userInfo = req?.user?.userId || 'unknown';
      const ipAddress = req?.ip || req?.connection?.remoteAddress || 'Unknown';
      await this.systemLogService.createLogFromSystem({
        action,
        details,
        method: action,
        status: 'SUCCESS',
        type,
        subType: type,
        userInfo,
        ipAddress,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Failed to log action: ${details}`, error);
    }
  }

  @Get('my-roles')
  getMyRoles(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId || 'demo-user-id';
    return this.permissionsService.getUserRolesInDepartment(userId);
  }

  @Get('roles')
  getRoles() {
    return this.permissionsService.findAllRoles();
  }

  @Post('roles')
  createRole(@Body() payload: any) {
    return this.permissionsService.createRole(payload);
  }

  @Get('permissions')
  getPermissions() {
    return this.permissionsService.findAllPermissions();
  }

  @Get('departments/:departmentId/permission-matrix')
  getMatrix(@Param('departmentId') departmentId: string) {
    return this.permissionsService.getMatrix(departmentId);
  }

  @Put('departments/:departmentId/permission-matrix')
  async updateMatrix(
    @Param('departmentId') departmentId: string,
    @Body() payload: { role_id: string; permission_id: string }[],
    @Req() req: any,
  ) {
    const result = await this.permissionsService.updateMatrix(departmentId, payload);
    await this.logAction(req, 'PUT', `Cập nhật ma trận quyền cho phòng ban ${departmentId}`, 'BULLETIN_PERMISSION');
    return result;
  }

  @Get('departments/:departmentId/members')
  getMembers(
    @Param('departmentId') departmentId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.permissionsService.getMembers(departmentId, Number(page), Number(limit));
  }

  @Post('departments/:departmentId/members')
  async addMember(
    @Param('departmentId') departmentId: string,
    @Body('user_id') userId: string,
    @Body('role_id') roleId: string,
    @Req() req: any,
  ) {
    const result = await this.permissionsService.addMember(departmentId, userId, roleId);
    await this.logAction(req, 'POST', `Thêm thành viên ${userId} vào phòng ban ${departmentId} với vai trò ${roleId}`, 'BULLETIN_MEMBER');
    return result;
  }

  @Put('departments/:departmentId/members/:userId')
  async updateMemberRole(
    @Param('departmentId') departmentId: string,
    @Param('userId') userId: string,
    @Body('role_id') roleId: string,
    @Req() req: any,
  ) {
    const result = await this.permissionsService.updateMemberRole(departmentId, userId, roleId);
    await this.logAction(req, 'PUT', `Cập nhật vai trò thành viên ${userId} trong phòng ban ${departmentId} thành ${roleId}`, 'BULLETIN_MEMBER');
    return result;
  }

  @Delete('departments/:departmentId/members/:userId')
  async removeMember(@Param('departmentId') departmentId: string, @Param('userId') userId: string, @Req() req: any) {
    const result = await this.permissionsService.removeMember(departmentId, userId);
    await this.logAction(req, 'DELETE', `Xóa thành viên ${userId} khỏi phòng ban ${departmentId}`, 'BULLETIN_MEMBER');
    return result;
  }
}
