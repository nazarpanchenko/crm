import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { JWT_ACCESS_TOKEN_EXPIRES_IN } from 'src/config/consts';
import { AuthService } from 'src/core/auth/auth.service';
import { AuthController } from 'src/core/auth/auth.controller';
import { User } from 'src/users/entities/user.entity';
import { Workspace } from 'src/workspaces/entities/workspaces.entity';
import { LocalStrategy } from 'src/core/auth/strategies/local.strategy';
import { JwtStrategy } from 'src/core/auth/strategies/jwt.strategy';
import { RefreshTokenModule } from 'src/core/refresh-token/refresh-token.module';
import { MailTokenService } from 'src/core/mail/mail-token.service';
import { UsersModule } from 'src/users/users.module';
import { UserEmail } from 'src/users/entities/user-email.entity';
import { MailModule } from 'src/core/mail/mail.module';
import { MailToken } from 'src/core/mail/entities/mail-token.entity';
import { Membership } from 'src/workspaces/entities/membership.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserEmail,
      Workspace,
      MailToken,
      Membership,
    ]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN as unknown as number,
        },
      }),
      inject: [ConfigService],
    }),
    RefreshTokenModule,
    UsersModule,
    MailModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, MailTokenService],
  controllers: [AuthController],
  exports: [AuthService, TypeOrmModule],
})
export class AuthModule {}
