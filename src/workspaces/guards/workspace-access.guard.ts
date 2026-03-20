import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

import { AuthRequest } from 'src/shared/types/auth.types';

@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: AuthRequest = context.switchToHttp().getRequest();
    if (!request.user) {
      throw new ForbiddenException('User not authenticated');
    }

    const workspaceId = request.params['workspaceId'];
    if (!workspaceId) {
      throw new ForbiddenException('Workspace ID missing in request');
    }

    const hasAccess = request.user.memberships.some(
      (m) => m.workspaceId === workspaceId,
    );
    if (!hasAccess) {
      throw new ForbiddenException('Access to workspace denied');
    }
    return true;
  }
}
