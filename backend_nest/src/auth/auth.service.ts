import { Injectable, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { STATUS } from 'src/variables/CONST_STATUS';
import { AuthConfigService } from 'src/auth-config/auth-config.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SessionLockService } from './session-lock.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity, 'mssqlConnection')
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly authConfigService: AuthConfigService,
    private readonly sessionLockService: SessionLockService,
  ) { }

  /**
   * Xác thực tài khoản nhân viên lưu trong database MSSQL.
   * Hỗ trợ truy vấn password (kể cả khi select: false) và so khớp bcrypt / plaintext fallback.
   */
  async validateUser(username: string, password: string): Promise<any> {
    if (!username || !password) return null;

    // Phải dùng createQueryBuilder để lấy cột password vì UserEntity đặt select: false
    const user = await this.userRepo.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username: username.trim() })
      .orWhere('user.emailUser = :email', { email: username.trim() })
      .getOne();

    if (!user) {
      this.logger.debug(`[validateUser] User not found in local DB: ${username}`);
      return null;
    }

    if (user.status === STATUS.LOCKED || user.status === STATUS.DELETED || user.status === STATUS.NOT_ACTIVED) {
      this.logger.warn(`[validateUser] User ${username} is inactive (status = ${user.status})`);
      throw new UnauthorizedException('Tài khoản chưa được kích hoạt hoặc đã bị khóa.');
    }

    let isMatch = false;

    if (user.password) {
      // Thử so khớp qua bcrypt
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        // Plaintext fallback (cho tài khoản seed ban đầu)
        isMatch = user.password === password;
        if (isMatch) {
          // Tự động nâng cấp sang bcrypt hash để bảo mật
          const hashed = await bcrypt.hash(password, 10);
          await this.userRepo.update(user.id, { password: hashed });
          this.logger.log(`[validateUser] Auto-migrated plaintext password to bcrypt for user: ${username}`);
        }
      }
    } else {
      // Nếu tài khoản DB chưa có password, chấp nhận mật khẩu mặc định 123456 / 12345678 và cập nhật hash
      if (password === '123456' || password === '12345678') {
        isMatch = true;
        const hashed = await bcrypt.hash(password, 10);
        await this.userRepo.update(user.id, { password: hashed });
        this.logger.log(`[validateUser] Initialized default password for user: ${username}`);
      }
    }

    if (!isMatch) {
      this.logger.debug(`[validateUser] Password mismatch for local user: ${username}`);
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Cấp phát JWT Access Token và Refresh Token cho tài khoản local.
   */
  async login(user: any) {
    const sessionId = uuidv4();
    const jwtSecret = process.env.JWT_SECRET || 'EOFFICE_SECRET_KEY_2026';

    const payload = {
      sub: user.id,
      userId: user.id,
      username: user.username,
      email: user.emailUser || user.email,
      name: user.name || user.fullName || user.username,
      preferred_username: user.username,
      type: 'local',
      sid: sessionId,
      roles: [],
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '7d',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, sid: sessionId, type: 'refresh' },
      { secret: jwtSecret, expiresIn: '30d' }
    );

    // Đăng ký session lock chống đăng nhập đồng thời
    this.sessionLockService.registerSession(user.id, sessionId);

    this.logger.log(`[LocalAuth] User ${user.username} logged in successfully via Local Database.`);

    return {
      success: true,
      message: 'Đăng nhập thành công',
      token: accessToken,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 604800,
      user: payload,
    };
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
    try {
      const jwtSecret = process.env.JWT_SECRET || 'EOFFICE_SECRET_KEY_2026';
      const decoded: any = this.jwtService.verify(refreshToken, { secret: jwtSecret });

      const user = await this.userRepo.findOne({
        where: { id: decoded.sub },
        select: ['id', 'username', 'name', 'emailUser', 'status'],
      });

      if (!user || user.status !== STATUS.ACTIVED) {
        throw new UnauthorizedException('Người dùng không tồn tại hoặc đã bị khóa.');
      }

      return await this.login(user);
    } catch (err) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn.');
    }
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
