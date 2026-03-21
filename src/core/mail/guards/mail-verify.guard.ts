import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

import { AuthRequest } from 'src/shared/types/auth.types';

@Injectable()
export class MailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: AuthRequest = context.switchToHttp().getRequest();
    if (!request.user?.emailVerified) {
      throw new ForbiddenException(
        'This email has not been verified yet. Please verify it to proceed',
      );
    }
    return true;
  }
}
