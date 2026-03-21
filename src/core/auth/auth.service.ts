import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';

import {
  COOKIE_MAX_AGE,
  OTP_EXPIRES_IN,
  JWT_REFRESH_TOKEN_EXPIRES_IN,
  PASSWORD_RESET_EMAIL_EXPIRES_IN,
  SALT_ROUNDS,
} from 'src/config/consts';
import {
  AuthRequest,
  MailTokenResponse,
  VerificationMessageTokenType,
  WorkspaceRole,
} from 'src/shared/types/auth.types';
import { User } from 'src/users/entities/user.entity';
import { Workspace } from 'src/workspaces/entities/workspaces.entity';
import { SignupDto } from 'src/core/auth/dto/signup.dto';
import { UserDto } from 'src/users/dto/user.dto';
import { AddSecondaryEmailDto } from 'src/core/mail/dto/secondary-email.dto';
import { MailService } from 'src/core/mail/mail.service';
import { MailToken } from 'src/core/mail/entities/mail-token.entity';
import { MailTokenService } from 'src/core/mail/mail-token.service';
import { RefreshTokenService } from 'src/core/refresh-token/refresh-token.service';
import { Membership } from 'src/workspaces/entities/membership.entity';
import { UserEmail } from 'src/users/entities/user-email.entity';
import { VerifySecondaryEmailDto } from '../mail/dto/verify-secondary-email.dto';

type UseMfaLogInResponse = {
  accessToken: string;
  refreshToken: string;
};

type ValidateUserResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type VerifyMfaResponse = { mfaRequired: boolean };
type VerifySecondaryMailResponse = { message: string };
type ResetPasswordResponse = { message: string; newPassword: string };

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Membership)
    private membershipRepo: Repository<Membership>,
    @InjectRepository(Workspace) private workspaceRepo: Repository<Workspace>,
    @InjectRepository(MailToken) private mailTokenRepo: Repository<MailToken>,
    private jwtService: JwtService,
    private mailService: MailService,
    private refreshTokenService: RefreshTokenService,
    @InjectRepository(UserEmail) private userEmailRepo: Repository<UserEmail>,
    private mailTokenService: MailTokenService,
  ) {}

  async signup(dto: SignupDto) {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      emailVerified: false,
    });
    await this.userRepo.save(user);

    const workspace = this.workspaceRepo.create({
      name: `${user.firstName}'s Workspace`,
      ownerId: user.id,
    });
    await this.workspaceRepo.save(workspace);

    const membership = this.membershipRepo.create({
      user,
      workspace,
      role: WorkspaceRole.ADMIN,
    });
    await this.membershipRepo.save(membership);

    const token = randomBytes(32).toString('hex'); // 64-character secure token
    const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + Number(COOKIE_MAX_AGE));
    const mailToken = this.mailTokenRepo.create({
      token: tokenHash,
      user,
      expiresAt,
      type: VerificationMessageTokenType.MAIL,
    });

    await this.mailTokenRepo.save(mailToken);
    return await this.mailService.sendSignUpConfirmation(user.email, token);
  }

  async confirmEmail(email: string, token: string): Promise<MailTokenResponse> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid email');

    const record = await this.mailTokenRepo.findOne({
      where: { user, type: VerificationMessageTokenType.MAIL },
    });
    if (
      !record ||
      record.expiresAt < new Date() ||
      !(await bcrypt.compare(token, record.token))
    ) {
      throw new UnauthorizedException('Token expired or invalid');
    }

    user.emailVerified = true;
    await this.userRepo.save(user);
    await this.mailTokenRepo.delete(record.id);
    return { message: 'Email verified successfully', token };
  }

  async requestMfa(user: User): Promise<VerifyMfaResponse> {
    const otp = randomInt(100000, 999999).toString();
    user.otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
    user.otpExpires = new Date(
      Date.now() + parseInt(OTP_EXPIRES_IN) * 60 * 1000,
    );
    await this.userRepo.save(user);
    await this.mailService.sendOtp(user.email, otp);
    return { mfaRequired: true };
  }

  async verifyMfa(email: string, otp: string): Promise<UseMfaLogInResponse> {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['memberships', 'memberships.workspace'],
    });

    if (
      !user ||
      !user.otpHash ||
      !user.otpExpires ||
      user.otpExpires < new Date()
    ) {
      throw new UnauthorizedException();
    }

    const valid = await bcrypt.compare(otp, user.otpHash);
    if (!valid) throw new UnauthorizedException();

    user.otpHash = null;
    user.otpExpires = null;
    await this.userRepo.save(user);

    const payload = {
      sub: user.id,
      memberships: user.memberships.map((m) => ({
        workspaceId: m.workspace.id,
        role: m.role,
      })),
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.refreshTokenService.createRefreshToken(
      user,
      Number(JWT_REFRESH_TOKEN_EXPIRES_IN),
    );

    return { accessToken, refreshToken };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<ValidateUserResponse> {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['memberships', 'memberships.workspace'],
    });
    if (!user) throw new UnauthorizedException('User not found');

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches)
      throw new UnauthorizedException('Invalid credentials');

    return new UserDto(user);
  }

  async requestPasswordReset(email: string): Promise<MailTokenResponse> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found');

    const token = randomBytes(32).toString('hex'); // 64-character secure token
    const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);
    const expiresAt = new Date(
      Date.now() + Number(PASSWORD_RESET_EMAIL_EXPIRES_IN),
    );
    const resetToken = this.mailTokenRepo.create({
      token: tokenHash,
      user,
      expiresAt,
      type: VerificationMessageTokenType.OTP,
    });

    await this.mailTokenRepo.save(resetToken);
    await this.mailService.sendOtp(user.email, token);
    return { message: 'Password reset token sent', token };
  }

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<ResetPasswordResponse> {
    const user = await this.findUserByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');

    const record = await this.mailTokenService.validateToken(
      user,
      token,
      VerificationMessageTokenType.OTP,
    );
    if (!record) {
      throw new BadRequestException('Token is not valid');
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.userRepo.save(user);
    await this.mailTokenRepo.delete(record.id as string);
    return { message: 'Password reset successfully', newPassword };
  }

  async addSecondaryEmail(
    user: AuthRequest['user'],
    dto: AddSecondaryEmailDto,
  ): Promise<MailTokenResponse> {
    const userEntity = await this.userRepo.findOne({
      where: { id: user?.sub },
    });
    if (!userEntity) {
      throw new NotFoundException('User not found');
    }

    const existingEmails = await this.userEmailRepo.find({
      where: { user: { id: user?.sub } },
    });

    if (existingEmails.some(({ email }) => email === dto.email)) {
      throw new BadRequestException('Email already in use');
    }

    if (existingEmails.length >= 1) {
      throw new BadRequestException('Only one secondary email is allowed');
    }

    await this.userEmailRepo.insert({
      email: dto.email,
      user: { id: userEntity.id },
      isPrimary: false,
      isVerified: false,
    });

    const { token } = await this.mailTokenService.generateToken(
      userEntity,
      VerificationMessageTokenType.MAIL,
      Number(COOKIE_MAX_AGE),
      { email: dto.email },
    );
    await this.mailService.sendSecondaryEmailInvitation(dto.email, token);
    return { message: 'Verification email sent', token };
  }

  async verifySecondaryEmail(
    user: User,
    dto: VerifySecondaryEmailDto,
  ): Promise<VerifySecondaryMailResponse> {
    const tokenPayload = await this.mailTokenService.validateToken(
      user,
      dto.token,
      VerificationMessageTokenType.OTP,
    );
    if (!tokenPayload) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const emailEntity = await this.userEmailRepo.findOne({
      where: { email: tokenPayload.email, user: { id: user.id } },
    });
    if (!emailEntity) {
      throw new UnauthorizedException('Email is missing in token payload');
    }

    emailEntity.isVerified = true;
    await this.userEmailRepo.save(emailEntity);
    return { message: 'Secondary email verified' };
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: { email },
    });
    if (user) return user;

    const emailEntity = await this.userEmailRepo.findOne({
      where: { email, isVerified: true },
      relations: ['user'],
    });
    return emailEntity?.user || null;
  }
}
