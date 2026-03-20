import { UseGuards } from '@nestjs/common';

import { WorkspaceRole } from 'src/shared/types/auth.types';
import { WorkspaceRoleGuardFactory } from 'src/workspaces/guards/workspace-role.guard';

export function RequireWorkspaceRole(role: WorkspaceRole) {
  return UseGuards(WorkspaceRoleGuardFactory(role));
}
