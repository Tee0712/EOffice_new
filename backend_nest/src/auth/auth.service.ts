import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { STATUS } from 'src/variables/CONST_STATUS';
import { AuthConfigService } from 'src/auth-config/auth-config.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity, 'mssqlConnection')
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly authConfigService: AuthConfigService,
  ) { }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepo.findOneBy({ username });
    if (!user) throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    if (!user.password) throw new UnauthorizedException('Tài khoản chưa có mật khẩu nội bộ');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');

    if (user.status !== STATUS.ACTIVED) {
      throw new UnauthorizedException('Tài khoản chưa được kích hoạt');
    }

    const { password: _, ...result } = user;
    return result;
  }
  // ❌ Đăng nhập nội bộ đã bị vô hiệu hóa - hệ thống chuyển 100% sang Keycloak SSO
  async login(user: any) {
    throw new UnauthorizedException(
      'Đăng nhập nội bộ đã bị vô hiệu hóa. Vui lòng đăng nhập qua Keycloak SSO.',
    );
  }

  private parseDurationToSeconds(value: string): number | null {
    if (!value) return null;
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (!match) return null;
    const amount = Number(match[1]);
    const unit = match[2];
    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 60 * 60 * 24;
      default:
        return null;
    }
  }

  async refreshToken(refreshToken: string) {
    throw new UnauthorizedException(
      'Refresh token nội bộ đã bị vô hiệu hóa. Vui lòng đăng nhập lại qua Keycloak SSO.',
    );
  }

  async getSsoRedirectUrl(): Promise<string> {
    const config = await this.authConfigService.findActive();

    if (!config) {
      throw new NotFoundException(`Không tìm thấy cấu hình xác thực nào đang hoạt động.`);
    }

    if (config.authType === 'local') {
      return process.env.FRONTEND_LOGIN_URL || '/login';
    }

    const { config: ssoConfig } = config;

    if (!ssoConfig?.authUrl || !ssoConfig?.clientId || !ssoConfig?.redirectUri) {
      throw new Error(`Cấu hình xác thực cho '${config.authType}' không đầy đủ trong database.`);
    }

    const scope = ssoConfig.scope || 'openid profile email'; // Ưu tiên scope từ DB
    const responseType = 'code';

    const params = new URLSearchParams({
      client_id: ssoConfig.clientId,
      redirect_uri: ssoConfig.redirectUri,
      response_type: responseType,
      scope: scope,
    });

    return `${ssoConfig.authUrl}?${params.toString()}`;
  }

  async getSsoLogoutUrl(): Promise<string> {
    const config = await this.authConfigService.findActive();

    if (!config) {
      throw new NotFoundException(`Không tìm thấy cấu hình xác thực nào đang hoạt động.`);
    }

    if (config.authType === 'local') {
      return process.env.FRONTEND_LOGIN_URL || '/login';
    }

    const { config: ssoConfig } = config;

    if (!ssoConfig?.logoutUrl) {
      console.warn(`Logout URL for provider '${config.authType}' is not configured. Falling back to login page.`);
      return process.env.FRONTEND_LOGIN_URL || '/login';
    }

    const postLogoutRedirectUri = process.env.FRONTEND_LOGIN_URL || '/login';

    const params = new URLSearchParams({ post_logout_redirect_uri: postLogoutRedirectUri });

    return `${ssoConfig.logoutUrl}?${params.toString()}`;
  }
}
