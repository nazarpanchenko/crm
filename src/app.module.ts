import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DBModule } from './core/db/db.module';
import { MorganMiddleware } from './common/middlewares/morgan.middleware';
import { AuthModule } from './core/auth/auth.module';
import { UsersModule } from './users/users.module';
import { RefreshTokenModule } from './core/refresh-token/refresh-token.module';
import { LoggerService } from './core/logger/logger.service';

const envFilePath = process.env.NODE_ENV
  ? process.env.ENV_CONFIG_PATH
  : '.env.development.local';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
    }),
    DBModule,
    AuthModule,
    UsersModule,
    RefreshTokenModule,
    LoggerService,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MorganMiddleware).forRoutes('*');
  }
}
