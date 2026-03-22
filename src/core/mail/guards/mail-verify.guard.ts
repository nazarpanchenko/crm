import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthRequest } from 'src/shared/types/auth.types';
import { User } from 'src/users/entities/user.entity';
import { AuthService } from 'src/core/auth/auth.service';
import { MailService } from 'src/core/mail/mail.service';

@Injectable()
export class MailVerifiedGuard implements CanActivate {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthRequest = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException();
    }

    const existing = await this.userRepo.findOne({
      where: { id: user.sub },
      select: ['id', 'email', 'emailVerified', 'emailVerificationExpiresAt'],
    });
    if (!existing) {
      throw new ForbiddenException();
    }

    const isVerified = this.authService.isEmailVerified(existing);
    if (!isVerified) {
      const token =
        await this.authService.saveSignupVerificationToken(existing);
      await this.mailService.sendSignUpConfirmation(existing.email, token);
      throw new ForbiddenException(
        `Your email has not been verified yet. New verification link was sent to your email.`,
      );
    }
    return true;
  }
}
