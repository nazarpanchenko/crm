import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspacesService } from 'src/workspaces/workspaces.service';
import { WorkspacesController } from 'src/workspaces/workspaces.controller';
import { WorkspaceAccessGuard } from 'src/workspaces/guards/workspace-access.guard';
import { RefreshToken } from 'src/core/refresh-token/entities/refresh-token.entity';
import { Workspace } from 'src/workspaces/entities/workspaces.entity';
import { Membership } from 'src/workspaces/entities/membership.entity';
import { InvitationToken } from 'src/workspaces/entities/invitation-token.entity';
import { AuthService } from 'src/core/auth/auth.service';
import { RefreshTokenService } from 'src/core/refresh-token/refresh-token.service';
import { User } from 'src/users/entities/user.entity';
import { MailToken } from 'src/core/mail/entities/mail-token.entity';
import { UserEmail } from 'src/users/entities/user-email.entity';
import { MailModule } from 'src/core/mail/mail.module';
import { MailTokenService } from 'src/core/mail/mail-token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workspace,
      Membership,
      InvitationToken,
      RefreshToken,
      User,
      UserEmail,
      MailToken,
    ]),
    MailModule,
  ],
  providers: [
    JwtService,
    WorkspacesService,
    WorkspaceAccessGuard,
    AuthService,
    RefreshTokenService,
    MailTokenService,
  ],
  controllers: [WorkspacesController],
  exports: [WorkspacesService],
})
export class WorkspaceModule {}
