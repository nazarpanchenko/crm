import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { WorkspaceRole } from 'src/shared/types/auth.types';
import { WorkspacesService } from 'src/workspaces/workspaces.service';
import { CreateWorkspaceDto } from 'src/workspaces/dto/createWorkspace.dto';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { WorkspaceAccessGuard } from 'src/workspaces/guards/workspace-access.guard';
import { RequireWorkspaceRole } from 'src/workspaces/guards/workspace-role.decorator';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspaceService: WorkspacesService) {}

  @Post(':workspaceId/invite')
  @UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  async inviteManager(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { email: string },
  ) {
    return this.workspaceService.inviteManager(workspaceId, body.email);
  }

  @Post()
  create(@Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspaceService.create(createWorkspaceDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.workspaceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspaceService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workspaceService.remove(id);
  }
}
