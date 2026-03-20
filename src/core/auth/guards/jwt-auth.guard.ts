import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from 'src/shared/types/auth.types';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAllowed = (await super.canActivate(context)) as boolean;
    if (!isAllowed) return false;

    const request: AuthRequest = context.switchToHttp().getRequest();
    if (!request.user) {
      throw new UnauthorizedException('JWT validation failed');
    }
    return true;
  }
}
