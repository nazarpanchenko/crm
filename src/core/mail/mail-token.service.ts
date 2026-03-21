import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { SALT_ROUNDS } from 'src/config/consts';
import {
  TokenPayload,
  VerificationMessageTokenType,
} from 'src/shared/types/auth.types';
import { MailToken } from 'src/core/mail/entities/mail-token.entity';
import { User } from 'src/users/entities/user.entity';

type GenerateTokenResponse = {
  token: string;
  email?: string;
};

type VerifyTokenResult =
  | { status: 'valid'; record: MailToken }
  | { status: 'expired' }
  | { status: 'invalid' };

@Injectable()
export class MailTokenService {
  constructor(
    @InjectRepository(MailToken)
    private readonly mailTokenRepo: Repository<MailToken>,
  ) {}

  async generateToken(
    user: User,
    type: VerificationMessageTokenType,
    expirationMs: number,
    payload?: TokenPayload,
  ): Promise<GenerateTokenResponse> {
    const token: string = randomInt(100000, 999999).toString();
    const tokenHash: string = await bcrypt.hash(token, SALT_ROUNDS);
    const expiresAt: Date = new Date(Date.now() + expirationMs);
    const mailToken: MailToken = this.mailTokenRepo.create({
      token: tokenHash,
      user,
      expiresAt,
      type,
      payload: payload || null,
    });

    await this.mailTokenRepo.save(mailToken);
    return { token };
  }

  async verifyToken(
    user: User,
    token: string,
    type: VerificationMessageTokenType.OTP,
  ): Promise<VerifyTokenResult> {
    const records: MailToken[] = await this.mailTokenRepo.find({
      where: { user: { id: user.id }, type },
    });

    for (const record of records) {
      const isMatch: boolean = await bcrypt.compare(token, record.token);
      if (!isMatch) continue;

      if (record.expiresAt < new Date()) {
        await this.deleteToken(record);
        return { status: 'expired' };
      }
      return { status: 'valid', record };
    }
    return { status: 'invalid' };
  }

  async validateToken(
    user: User,
    token: string,
    type: VerificationMessageTokenType.OTP,
  ): Promise<TokenPayload | void> {
    const result: VerifyTokenResult = await this.verifyToken(user, token, type);
    if (result.status === 'valid') {
      return result.record;
    }

    throw new Error(
      result.status === 'expired' ? 'Token expired' : 'Invalid token',
    );
  }

  async deleteToken(record: TokenPayload): Promise<void> {
    await this.mailTokenRepo.delete(record.id!);
  }
}
