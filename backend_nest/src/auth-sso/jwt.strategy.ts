import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

import { SessionLockService } from '../auth/session-lock.service';

const cookieExtractor = (req: any) => {
  const v = req?.cookies?.tokenUser || req?.cookies?.token;
  return (typeof v === 'string' && v.split('.').length === 3) ? v : null;
};

// Client cache JWKS của Keycloak
const keycloakJwksClient = jwksRsa({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `${process.env.KEYCLOAK_ISSUER || 'http://localhost:8080/realms/master'}/protocol/openid-connect/certs`,
});

// Hybrid Secret Provider: Tự động phân biệt Local Token (HS256) vs Keycloak Token (RS256)
const hybridSecretOrKeyProvider = (request: any, rawJwtToken: any, done: (err: any, secretOrKey?: any) => void) => {
  try {
    const decoded: any = jwt.decode(rawJwtToken, { complete: true });
    if (!decoded || !decoded.header) {
      return done(new UnauthorizedException('Token không hợp lệ (không thể giải mã header)'));
    }

    const localSecret = process.env.JWT_SECRET || 'EOFFICE_SECRET_KEY_2026';
    console.log('[JwtStrategy] Using secret:', localSecret.substring(0, 10) + '...');

    // 1. Nếu là token ký bởi Local AuthService (HS256 hoặc có claim type = 'local')
    if (decoded.header.alg === 'HS256' || decoded.payload?.type === 'local') {
      console.log('[JwtStrategy] Detected local token (HS256), using local secret');
      return done(null, localSecret);
    }

    // 2. Nếu là token RS256 có kid (Keycloak SSO)
    if (decoded.header.kid && process.env.KEYCLOAK_ISSUER) {
      keycloakJwksClient.getSigningKey(decoded.header.kid, (err, key) => {
        if (err || !key) {
          // Fallback về local secret nếu Keycloak JWKS không tải được
          return done(null, localSecret);
        }
        const signingKey = key.getPublicKey();
        return done(null, signingKey);
      });
      return;
    }

    // Fallback mặc định
    return done(null, localSecret);
  } catch (err) {
    return done(err);
  }
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-cookie') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    @InjectRepository(UserEntity, 'mssqlConnection')
    private readonly userRepo: Repository<UserEntity>,
    private readonly sessionLockService: SessionLockService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: hybridSecretOrKeyProvider,
      algorithms: ['RS256', 'HS256'],
    });
  }

  async validate(payload: any) {
    const userIdOrSub = payload.userId || payload.sub;
    if (!userIdOrSub) {
      throw new UnauthorizedException('Token không hợp lệ (không tìm thấy user id hoặc sub).');
    }

    // 1. Tìm user theo id trực tiếp (Tài khoản local hoặc đã map)
    let user = await this.userRepo.findOne({
      where: { id: userIdOrSub },
      select: ['id', 'username', 'status'],
    });

    // 2. Nếu không tìm thấy theo id, tìm theo keycloakUserId
    if (!user) {
      user = await this.userRepo.findOne({
        where: { keycloakUserId: userIdOrSub },
        select: ['id', 'username', 'status'],
      });
    }

    // 3. Nếu vẫn không thấy, tìm theo username (preferred_username)
    if (!user && (payload.preferred_username || payload.username)) {
      const username = payload.preferred_username || payload.username;
      user = await this.userRepo.findOne({
        where: { username },
        select: ['id', 'username', 'status'],
      });

      if (!user && payload.preferred_username) {
        // Tự động tạo user JIT nếu đăng nhập từ Keycloak
        const fullName = `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || payload.preferred_username;
        const hashedPassword = await bcrypt.hash('12345678', 10);

        const newUser = this.userRepo.create({
          id: uuidv4(),
          name: fullName,
          username: payload.preferred_username,
          emailUser: payload.email,
          keycloakUserId: userIdOrSub,
          status: 1, // STATUS.ACTIVED
          password: hashedPassword,
          createdAt: new Date(),
        });

        user = await this.userRepo.save(newUser);
      } else if (user && !user.keycloakUserId && payload.sub) {
        await this.userRepo.update(user.id, { keycloakUserId: payload.sub });
      }
    }

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại trong hệ thống.');
    }

    if (user.status !== 1) {
      throw new UnauthorizedException('Tài khoản đã bị khóa hoặc chưa được kích hoạt.');
    }

    // Session Lock check (Single device login)
    const sessionId = payload.sid || payload.session_state || payload.jti;
    if (sessionId && !this.sessionLockService.validateSession(user.id, sessionId)) {
      throw new UnauthorizedException('Phiên đăng nhập đã bị đăng xuất do tài khoản được đăng nhập trên thiết bị khác.');
    }

    return { userId: user.id, id: user.id, username: user.username };
  }
}

