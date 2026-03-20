import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { Membership } from 'src/workspaces/entities/membership.entity';
import { WorkspaceRole } from 'src/shared/types/auth.types';

@Injectable()
export class WorkspaceRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const workspaceId = request.params.workspaceId || request.body.workspaceId;
    if (!workspaceId) {
      throw new ForbiddenException('Workspace context required');
    }

    const membership = await this.dataSource.getRepository(Membership).findOne({
      where: {
        user: { id: user.id },
        workspace: { id: workspaceId },
      },
      relations: ['workspace', 'user'],
    });
    if (!membership) {
      throw new ForbiddenException('Not a workspace member');
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
