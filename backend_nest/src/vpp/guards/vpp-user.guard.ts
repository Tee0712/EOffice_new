import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class VppUserGuard implements CanActivate {
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

    // Cho phép nếu có role 'user_vpp' HOẶC 'admin_vpp'
    const isAuthorized = staticPermissions.some(
      (p) => p.code === 'user_vpp' || p.code === 'admin_vpp',
    );

    if (!isAuthorized) {
      throw new ForbiddenException('Bạn không có quyền truy cập vào module Văn phòng phẩm (Yêu cầu quyền user_vpp hoặc admin_vpp)');
    }

    return true;
  }
}
