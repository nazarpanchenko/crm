import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MailToken } from 'src/core/mail/entities/mail-token.entity';
import { MailTokenService } from 'src/core/mail/mail-token.service';
import { MailTokenController } from 'src/core/mail/mail-token.controller';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MailToken, User])],
  providers: [MailTokenService],
  controllers: [MailTokenController],
  exports: [MailTokenService],
})
export class MailTokenModule {}
