import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { RefreshToken } from 'src/core/refresh-token/entities/refresh-token.entity';
import { RefreshTokenService } from 'src/core/refresh-token/refresh-token.service';
import { RefreshTokenController } from 'src/core/refresh-token/refresh-token.controller';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { Workspace } from 'src/workspaces/entities/workspaces.entity';
import { Membership } from 'src/workspaces/entities/membership.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, User, Workspace, Membership]),
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  providers: [RefreshTokenService, UsersService],
  controllers: [RefreshTokenController],
  exports: [RefreshTokenService],
})
export class RefreshTokenModule {}
