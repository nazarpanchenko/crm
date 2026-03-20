import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from 'src/shared/types/auth.types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: WorkspaceRole[]) =>
  SetMetadata(ROLES_KEY, roles);
