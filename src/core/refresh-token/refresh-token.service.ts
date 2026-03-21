import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

import { SALT_ROUNDS } from 'src/config/consts';
import { RefreshToken } from 'src/core/refresh-token/entities/refresh-token.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class RefreshTokenService {
  private revokedAccessTokens = new Set<string>();

  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
  ) {}

  async createRefreshToken(user: User, expiresInMs: number): Promise<string> {
    const token = randomBytes(64).toString('hex'); // 128-char token
    const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);
    const refreshToken = this.refreshTokenRepo.create({
      tokenHash,
      user,
      expiresAt: new Date(Date.now() + expiresInMs),
    });
    await this.refreshTokenRepo.save(refreshToken);
    return token;
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const tokens = await this.refreshTokenRepo.find({ relations: ['user'] });

    for (const t of tokens) {
      const isMatch = await bcrypt.compare(refreshToken, t.tokenHash);
      if (isMatch) {
        if (t.expiresAt < new Date()) {
          await this.refreshTokenRepo.delete(t.id);
          throw new UnauthorizedException('Refresh token expired');
        }

        const refreshToken = await this.refreshTokenRepo.findOne({
          where: { id: t.id },
          relations: ['user', 'user.memberships', 'user.memberships.workspace'],
        });
        if (!refreshToken || !refreshToken.user) {
          throw new UnauthorizedException('Refresh token not found');
        }

        const payload = {
          sub: refreshToken.user.id,
          memberships: refreshToken.user.memberships.map((m) => ({
            workspaceId: m.workspace.id,
            role: m.role,
          })),
        };
        return this.jwtService.sign(payload);
      }
    }

    throw new UnauthorizedException('Invalid refresh token');
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const tokens = await this.refreshTokenRepo.find();
    for (const t of tokens) {
      const match = await bcrypt.compare(token, t.tokenHash);
      if (match) {
        await this.refreshTokenRepo.delete(t.id);
      }
    }
  }

  revokeAccessToken(token: string): void {
    this.revokedAccessTokens.add(token);
  }

  isTokenRevoked(token: string): boolean {
    return this.revokedAccessTokens.has(token);
  }
}
