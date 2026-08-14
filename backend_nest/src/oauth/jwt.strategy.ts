import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { passportJwtSecret } from 'jwks-rsa';
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
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        // Cần đảm bảo KEYCLOAK_ISSUER được cấu hình trong .env (VD: http://localhost:8080/realms/master)
        jwksUri: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/certs`,
      }),
      algorithms: ['RS256'],
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async validate(payload: any) {

    // Keycloak token payload thường chứa 'sub' là UUID của user
    const keycloakUserId = payload.sub;
    if (!keycloakUserId) {
      this.logger.error('[JWT validate] ❌ Token thiếu claim sub');
      throw new UnauthorizedException('Token không hợp lệ (không tìm thấy sub).');
    }

    // Ánh xạ `sub` của Keycloak về `userId` nội bộ trong DB của hệ thống
    let user = await this.userRepo.findOne({
      where: { keycloakUserId: keycloakUserId },
      select: ['id', 'status'],
    });

    if (!user) {
      // Nếu không tìm thấy bằng keycloakUserId, tìm fallback sang username
      user = await this.userRepo.findOne({
        where: { username: payload.preferred_username },
        select: ['id', 'status'],
      });

      if (!user) {
        // Just-In-Time Provisioning: Tự động tạo user mới nếu hoàn toàn chưa tồn tại
        const fullName = `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || payload.preferred_username;
        const hashedPassword = await bcrypt.hash('12345678', 10);

        const newUser = this.userRepo.create({
          id: uuidv4(),
          name: fullName,
          username: payload.preferred_username,
          emailUser: payload.email,
          keycloakUserId: keycloakUserId,
          status: 1, // STATUS.ACTIVED
          password: hashedPassword,
          createdAt: new Date(),
        });

        user = await this.userRepo.save(newUser);
      } else {
        // Nếu tìm thấy bằng username nhưng chưa có keycloakUserId, thì cập nhật keycloakUserId
        await this.userRepo.update(user.id, { keycloakUserId: keycloakUserId });
      }
    }

    return { userId: user.id };
  }
}
