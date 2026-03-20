import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

import { AuthRequest } from 'src/shared/types/auth.types';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is not defined');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => req?.cookies?.access_token ?? null,
      ]),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  // jwt.strategy.ts
  async validate(payload: { sub: string }): Promise<AuthRequest['user']> {
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
