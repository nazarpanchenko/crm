import {
  Controller,
  Post,
  Body,
  Res,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import type { Response } from 'express';

import { COOKIE_MAX_AGE } from 'src/config/consts';
import { RefreshTokenService } from 'src/core/refresh-token/refresh-token.service';
import { UsersService } from 'src/users/users.service';

@Controller('auth/refresh')
export class RefreshTokenController {
  constructor(
    private refreshTokenService: RefreshTokenService,
    private userService: UsersService,
  ) {}

  @Post()
  @HttpCode(200)
  async refresh(
    @Body('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken =
      await this.refreshTokenService.refreshAccessToken(refreshToken);
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    });
    return { success: true };
  }

  @Post('revoke')
  @HttpCode(200)
  async revoke(@Body('refreshToken') refreshToken: string) {
    await this.refreshTokenService.revokeRefreshToken(refreshToken);
    return { success: true };
  }

  @Post('create')
  @HttpCode(201)
  async create(@Body('userId') userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const token = await this.refreshTokenService.createRefreshToken(
      user,
      COOKIE_MAX_AGE as number,
    );
    return { refreshToken: token };
  }
}
