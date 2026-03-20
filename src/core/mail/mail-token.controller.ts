import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { JWT_ACCESS_TOKEN_EXPIRES_IN } from 'src/config/consts';
import { VerificationMessageTokenType } from 'src/shared/types/auth.types';
import { MailTokenService } from 'src/core/mail/mail-token.service';
import { User } from 'src/users/entities/user.entity';

@Controller('email-token')
export class MailTokenController {
  constructor(
    private readonly mailTokenService: MailTokenService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Post('generate')
  async generate(
    @Body() body: { email: string; type: VerificationMessageTokenType },
  ) {
    const user = await this.userRepo.findOne({
      where: { email: body.email },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const result = await this.mailTokenService.generateToken(
      user,
      body.type,
      Number(JWT_ACCESS_TOKEN_EXPIRES_IN),
    );
    return { token: result.token };
  }

  @Post('validate')
  async validate(
    @Body()
    body: {
      email: string;
      token: string;
      type: VerificationMessageTokenType.OTP;
    },
  ) {
    const user = await this.userRepo.findOne({
      where: { email: body.email },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const record = await this.mailTokenService.validateToken(
      user,
      body.token,
      body.type,
    );
    if (!record) {
      throw new UnauthorizedException('Token is invalid');
    }

    await this.mailTokenService.deleteToken(record);
    return { message: 'Token valid' };
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; token: string }) {
    const user = await this.userRepo.findOne({
      where: { email: body.email },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const result = await this.mailTokenService.verifyToken(
      user,
      body.token,
      VerificationMessageTokenType.OTP,
    );
    if (result.status === 'invalid') {
      throw new UnauthorizedException('Invalid token');
    }

    if (result.status === 'expired') {
      return {
        success: false,
        reason: 'expired',
      };
    }

    await this.mailTokenService.deleteToken(result.record);
    user.emailVerified = true;
    await this.userRepo.save(user);
    return { success: true };
  }
}
