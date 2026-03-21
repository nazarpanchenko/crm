import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';

import { WorkspaceRole, type AuthRequest } from 'src/shared/types/auth.types';
import { WorkspacesService } from 'src/workspaces/workspaces.service';
import { CreateWorkspaceDto } from 'src/workspaces/dto/createWorkspace.dto';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { WorkspaceAccessGuard } from 'src/workspaces/guards/workspace-access.guard';
import { WorkspaceRoleGuardFactory } from 'src/workspaces/guards/workspace-role.guard';
import { MailVerifiedGuard } from 'src/core/mail/guards/mail-verify.guard';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspaceService: WorkspacesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, MailVerifiedGuard)
  async create(@Body() dto: CreateWorkspaceDto, @Req() req: AuthRequest) {
    return this.workspaceService.create(dto, req.user!.sub);
  }

  @Post(':workspaceId/invite')
  @UseGuards(
    JwtAuthGuard,
    WorkspaceAccessGuard,
    WorkspaceRoleGuardFactory(WorkspaceRole.ADMIN),
  )
  async inviteManager(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { email: string },
  ) {
    return this.workspaceService.inviteManager(workspaceId, body.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.workspaceService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.workspaceService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.workspaceService.remove(id);
  }
}
