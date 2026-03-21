import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from 'src/users/users.service';
import { UsersController } from 'src/users/users.controller';
import { User } from 'src/users/entities/user.entity';
import { RefreshToken } from 'src/core/refresh-token/entities/refresh-token.entity';
import { Workspace } from 'src/workspaces/entities/workspaces.entity';
import { Membership } from 'src/workspaces/entities/membership.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, Workspace, Membership]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
