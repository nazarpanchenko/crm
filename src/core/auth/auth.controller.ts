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
import { User } from 'src/users/entities/user.entity';
import { AuthService } from 'src/core/auth/auth.service';
import { SignupDto } from 'src/core/auth/dto/signup.dto';
import { MfaDto } from 'src/core/auth/dto/mfa.dto';
import { LocalAuthGuard } from 'src/core/auth/guards/local-auth.guard';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { ForgotPasswordDto } from 'src/core/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/core/auth/dto/reset-password.dto';
import { AddSecondaryEmailDto } from '../mail/dto/secondary-email.dto';

interface AuthRequest extends Request {
  user: User;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('confirm-email')
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
  logout(@Res({ passthrough: true }) res: Response) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(
      body.email,
      body.token,
      body.newPassword,
    );
  }

  @Post('email/add')
  @UseGuards(JwtAuthGuard)
  async addSecondaryEmail(
    @Req() req: Request,
    @Body() dto: AddSecondaryEmailDto,
  ) {
    return this.authService.addSecondaryEmail(req.user as User, dto);
  }
}
