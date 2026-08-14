import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

const cookieExtractor = (req: any) => {
  const v = req?.cookies?.tokenUser || req?.cookies?.token;
  return (typeof v === 'string' && v.split('.').length === 3) ? v : null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-cookie') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    @InjectRepository(UserEntity, 'mssqlConnection')
    private readonly userRepo: Repository<UserEntity>,
  ) {
    super({
      // Prefer header first so Postman Bearer tests always work; cookie as fallback
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/certs`,
      }),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    const keycloakUserId = payload.sub;
    if (!keycloakUserId) {
      throw new UnauthorizedException('Token không hợp lệ (không tìm thấy sub).');
    }

    let user = await this.userRepo.findOne({
      where: { keycloakUserId: keycloakUserId },
      select: ['id', 'status'],
    });

    if (!user) {
      user = await this.userRepo.findOne({
        where: { username: payload.preferred_username },
        select: ['id', 'status'],
      });

      if (!user) {
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
        await this.userRepo.update(user.id, { keycloakUserId: keycloakUserId });
      }
    }

    return { userId: user.id };
  }
}

