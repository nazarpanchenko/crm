import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

import { AuthRequest } from 'src/shared/types/auth.types';
import { User } from 'src/users/entities/user.entity';
import { RefreshTokenService } from 'src/core/refresh-token/refresh-token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly refreshTokenService: RefreshTokenService,
    configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is not defined');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) =>
          (req.cookies as Record<string, string | undefined>).access_token ??
          null,
      ]),
      secretOrKey: secret,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: { sub: string },
  ): Promise<AuthRequest['user']> {
    const token =
      (req.cookies as Record<string, string | undefined>).access_token ??
      req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();

    const isRevoked = this.refreshTokenService.isTokenRevoked(token);
    if (isRevoked) throw new UnauthorizedException('Token has been revoked');

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      relations: ['memberships', 'memberships.workspace'],
    });
    if (!user) throw new UnauthorizedException();

    return {
      sub: user.id,
      emailVerified: user.emailVerified,
      memberships: user.memberships.map((m) => ({
        workspaceId: m.workspace.id,
        role: m.role,
      })),
    };
  }
}
