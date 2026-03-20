import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

import { AuthRequest } from 'src/shared/types/auth.types';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: AuthRequest = context.switchToHttp().getRequest();
    if (!request.user?.emailVerified) {
      throw new ForbiddenException(
        'Please verify your email before continuing',
      );
    }
    return true;
  }
}
