import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import * as jwksRsa from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractJwtFromCookie = (req: any): string | null => {
  const cookieToken = req?.cookies?.tokenUser || req?.cookies?.token;
  if (typeof cookieToken === 'string' && cookieToken.split('.').length === 3) {
    return cookieToken;
  }

  const rawCookieHeader = req?.headers?.cookie;
  if (typeof rawCookieHeader !== 'string' || !rawCookieHeader.trim()) {
    return null;
  }

  const cookies = rawCookieHeader.split(';').reduce((acc: Record<string, string>, item: string) => {
    const [rawKey, ...rawValue] = item.trim().split('=');
    if (!rawKey || rawValue.length === 0) {
      return acc;
    }

    acc[rawKey] = rawValue.join('=');
    return acc;
  }, {});

  const token = cookies.tokenUser || cookies.token;
  return typeof token === 'string' && token.split('.').length === 3 ? token : null;
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

    // 1. Nếu là token ký bởi Local AuthService (HS256 hoặc có claim type = 'local')
    if (decoded.header.alg === 'HS256' || decoded.payload?.type === 'local') {
      return done(null, localSecret);
    }

    // 2. Nếu là token RS256 có kid (Keycloak SSO)
    if (decoded.header.kid && process.env.KEYCLOAK_ISSUER) {
      keycloakJwksClient.getSigningKey(decoded.header.kid, (err, key) => {
        if (err || !key) {
          return done(null, localSecret);
        }
        const signingKey = key.getPublicKey();
        return done(null, signingKey);
      });
      return;
    }

    return done(null, localSecret);
  } catch (err) {
    return done(err);
  }
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    @InjectRepository(UserEntity, 'mssqlConnection')
    private readonly userRepo: Repository<UserEntity>,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractJwtFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('accessToken'),
        ExtractJwt.fromUrlQueryParameter('access_token'),
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: hybridSecretOrKeyProvider,
      algorithms: ['RS256', 'HS256'],
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async validate(payload: any) {
    const userIdOrSub = payload.userId || payload.sub;
    if (!userIdOrSub) {
      this.logger.error('[JWT validate] ❌ Token thiếu claim sub/userId');
      throw new UnauthorizedException('Token không hợp lệ (không tìm thấy sub hoặc userId).');
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
        // Just-In-Time Provisioning: Tự động tạo user mới nếu hoàn toàn chưa tồn tại
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

    return { userId: user.id, id: user.id, username: user.username };
  }
}
