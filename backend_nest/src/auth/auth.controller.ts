import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthKeycloakService } from 'src/auth-keycloak/auth-keycloak.service';
import { Public } from 'src/oauth/decorator/public.decorator';

@ApiTags('Xác thực cơ bản')
@Controller('auth-basic')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authKeycloakService: AuthKeycloakService,
  ) { }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Đăng nhập Hybrid (Local Database & Keycloak SSO)',
  })
  async login(@Body() body: any) {
    const { username, password } = body;
    if (!username || !password) {
      throw new UnauthorizedException('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
    }

    const cleanUsername = username.trim();

    // B1: Thử xác thực với tài khoản nhân viên lưu trong Database MSSQL nội bộ
    try {
      const localUser = await this.authService.validateUser(cleanUsername, password);
      if (localUser) {
        return await this.authService.login(localUser);
      }
    } catch (dbErr) {
      if (dbErr instanceof UnauthorizedException) {
        throw dbErr;
      }
    }

    // B2: Nếu không khớp tài khoản Local DB, Fallback sang Keycloak SSO Direct Grant
    try {
      return await this.authKeycloakService.loginDirectGrant(cleanUsername, password);
    } catch (kcErr) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác.');
    }
  }

  @Public()
  @Post('refresh-token')
  @ApiOperation({
    summary: 'Làm mới token (Hybrid)',
    description: 'Cấp lại access token bằng refresh token',
  })
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Vui lòng cung cấp refresh_token');
    }

    // Thử làm mới bằng Local Auth Service trước
    try {
      return await this.authService.refreshToken(refreshToken);
    } catch {
      // Fallback sang làm mới bằng Keycloak
      return await this.authKeycloakService.refreshAccessToken(refreshToken);
    }
  }
}
