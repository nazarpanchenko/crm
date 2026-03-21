import { Controller, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { MailVerifiedGuard } from 'src/core/mail/guards/mail-verify.guard';
import { UsersService } from 'src/users/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, MailVerifiedGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, MailVerifiedGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, MailVerifiedGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
