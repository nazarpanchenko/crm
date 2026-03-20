import { Module } from '@nestjs/common';
import { MailService } from 'src/core/mail/mail.service';

@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
