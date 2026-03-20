import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspacesService } from 'src/workspaces/workspaces.service';
import { WorkspacesController } from 'src/workspaces/workspaces.controller';
import { WorkspaceAccessGuard } from 'src/workspaces/guards/workspace-access.guard';
import { Workspace } from 'src/workspaces/entities/workspaces.entity';
import { Membership } from 'src/workspaces/entities/membership.entity';
import { InvitationToken } from 'src/workspaces/entities/invitation-token.entity';
import { User } from 'src/users/entities/user.entity';
import { MailModule } from 'src/core/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, Membership, InvitationToken, User]),
    MailModule,
  ],
  providers: [WorkspacesService, WorkspaceAccessGuard],
  controllers: [WorkspacesController],
  exports: [WorkspacesService],
})
export class WorkspaceModule {}
