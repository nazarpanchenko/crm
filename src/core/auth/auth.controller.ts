import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import { type Request, type Response } from 'express';

import {
  COOKIE_MAX_AGE,
  JWT_REFRESH_TOKEN_EXPIRES_IN,
} from 'src/config/consts';
import { type AuthRequest as AddSecondaryMailRequest } from 'src/shared/types/auth.types';
import { User } from 'src/users/entities/user.entity';
import { AuthService } from 'src/core/auth/auth.service';
import { SignupDto } from 'src/core/auth/dto/signup.dto';
import { MfaDto } from 'src/core/auth/dto/mfa.dto';
import { LocalAuthGuard } from 'src/core/auth/guards/local-auth.guard';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { ForgotPasswordDto } from 'src/core/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/core/auth/dto/reset-password.dto';
import { AddSecondaryEmailDto } from 'src/core/mail/dto/secondary-email.dto';
import { RefreshTokenService } from 'src/core/refresh-token/refresh-token.service';
import { VerifySecondaryEmailDto } from '../mail/dto/verify-secondary-email.dto';

interface AuthRequest extends Request {
  user: User;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm-email')
  @HttpCode(200)
  confirmEmail(@Body() body: { email: string; token: string }) {
    return this.authService.confirmEmail(body.email, body.token);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  login(@Req() req: AuthRequest) {
    return this.authService.requestMfa(req.user);
  }

  @Post('mfa')
  @HttpCode(200)
  async verifyMfa(
    @Body() dto: MfaDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.verifyMfa(
      dto.email,
      dto.otp,
    );
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE as number,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: JWT_REFRESH_TOKEN_EXPIRES_IN as number,
    });

    return { accessToken, refreshToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken = (req.cookies as Record<string, string | undefined>)
      .access_token;
    const refreshToken = (req.cookies as Record<string, string | undefined>)
      .refresh_token;

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);

    if (accessToken) this.refreshTokenService.revokeAccessToken(accessToken);
    if (refreshToken) {
      await this.refreshTokenService.revokeRefreshToken(refreshToken);
    }
  }

  @Post('forgot-password')
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('reset-password')
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(
      body.email,
      body.token,
      body.newPassword,
    );
  }

  @Post('email/add-secondary')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async addSecondaryEmail(
    @Req() req: AddSecondaryMailRequest,
    @Body() dto: AddSecondaryEmailDto,
  ) {
    return this.authService.addSecondaryEmail(req.user, dto);
  }

  @Post('email/confirm-secondary')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async verifySecondaryEmail(
    @Req() req: User,
    @Body() dto: VerifySecondaryEmailDto,
  ) {
    return this.authService.verifySecondaryEmail(req, dto);
  }
}
