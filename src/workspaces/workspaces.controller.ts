import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
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
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, MailVerifiedGuard)
  async create(@Body() dto: CreateWorkspaceDto, @Req() req: AuthRequest) {
    return this.workspaceService.create(dto, req.user!.sub);
  }

  @Post(':workspaceId/invite')
  @HttpCode(200)
  @UseGuards(
    JwtAuthGuard,
    MailVerifiedGuard,
    WorkspaceAccessGuard,
    WorkspaceRoleGuardFactory(WorkspaceRole.ADMIN),
  )
  async inviteManager(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { email: string },
  ) {
    return this.workspaceService.inviteManager(workspaceId, body.email);
  }

  @UseGuards(JwtAuthGuard, MailVerifiedGuard)
  @HttpCode(200)
  @Get()
  findAll() {
    return this.workspaceService.findAll();
  }

  @Get(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, MailVerifiedGuard)
  findOne(@Param('id') id: string) {
    return this.workspaceService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, MailVerifiedGuard)
  remove(@Param('id') id: string) {
    return this.workspaceService.remove(id);
  }
}
