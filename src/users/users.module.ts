import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from 'src/users/users.service';
import { UsersController } from 'src/users/users.controller';
import { User } from 'src/users/entities/user.entity';
import { UserEmail } from './entities/user-email.entity';
import { RefreshToken } from 'src/core/refresh-token/entities/refresh-token.entity';
import { MailToken } from 'src/core/mail/entities/mail-token.entity';
import { Workspace } from 'src/workspaces/entities/workspaces.entity';
import { Membership } from 'src/workspaces/entities/membership.entity';
import { AuthService } from 'src/core/auth/auth.service';
import { RefreshTokenService } from 'src/core/refresh-token/refresh-token.service';
import { MailService } from 'src/core/mail/mail.service';
import { MailTokenService } from 'src/core/mail/mail-token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserEmail,
      RefreshToken,
      MailToken,
      Workspace,
      Membership,
    ]),
  ],
  controllers: [UsersController],
  providers: [
    JwtService,
    UsersService,
    AuthService,
    RefreshTokenService,
    MailService,
    MailTokenService,
  ],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
