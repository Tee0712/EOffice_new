import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class VppAdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || (!user.userId && !user.user)) {
      return false;
    }

    const userId = user.userId || user.user;

    // Lấy thông tin quyền tĩnh (static roles) của người dùng
    const roleInfo = await this.usersService.findProcessRoleInfoById(userId);
    const staticPermissions = roleInfo.staticPermissions || [];

    // CHỈ cho phép nếu có role 'admin_vpp'
    const isAdmin = staticPermissions.some((p) => p.code === 'admin_vpp');

    if (!isAdmin) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác quản trị này (Yêu cầu quyền admin_vpp)');
    }

    return true;
  }
}
