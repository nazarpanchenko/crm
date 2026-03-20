import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Type,
} from '@nestjs/common';

import { AuthRequest, WorkspaceRole } from 'src/shared/types/auth.types';

export function WorkspaceRoleGuardFactory(
  role: WorkspaceRole,
): Type<CanActivate> {
  @Injectable()
  class RoleGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request: AuthRequest = context.switchToHttp().getRequest();
      if (!request.user) throw new ForbiddenException('User not authenticated');

      const workspaceId = request.params['workspaceId'];
      if (!workspaceId) throw new ForbiddenException('Workspace ID missing');

      const membership = request.user.memberships.find(
        (m) => m.workspaceId === workspaceId,
      );
      if (!membership) throw new ForbiddenException('Access denied');

      if (membership.role !== role) {
        throw new ForbiddenException(`User must be ${role} in this workspace`);
      }
      return true;
    }
  }

  return RoleGuard;
}
