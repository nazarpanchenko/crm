import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { NODEMAILER_PORT, OTP_EXPIRES_IN } from 'src/config/consts';
import { getParsedExpiryDateString } from 'src/shared/utils/string-parser.utils';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const IS_DEV_MODE = process.env.NODE_ENV === 'development';
    this.transporter = nodemailer.createTransport({
      host: process.env.NODEMAILER_HOST,
      port: Number(NODEMAILER_PORT),
      secure: !IS_DEV_MODE,
      auth: {
        user: process.env.NODEMAILER_USERNAME,
        pass: process.env.NODEMAILER_PASSWORD,
      },
      tls: {
        rejectUnauthorized: !IS_DEV_MODE,
      },
    });
  }

  async sendSignUpConfirmation(email: string, token: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.NODEMAILER_USERNAME,
      to: email,
      subject: 'Verify your email',
      html: `<p>Please verify your email by clicking <a href="${process.env.CLIENT_URL}/verify-email?email=${email}&token=${token}">here</a>.</p>`,
    });
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.NODEMAILER_USERNAME,
      to: email,
      subject: 'Your OTP Code',
      html: `<p>Your OTP code is <b>${otp}</b>. It expires in ${getParsedExpiryDateString(
        OTP_EXPIRES_IN,
      )}.</p>`,
    });
  }

  async sendInvitation(
    email: string,
    token: string,
    workspaceName: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.NODEMAILER_USERNAME,
      to: email,
      subject: `Invitation to join workspace: ${workspaceName}`,
      html: `<p>You have been invited to join the workspace <b>${workspaceName}</b>.<br>
             Click <a href="${process.env.CLIENT_URL}/accept-invite?token=${token}&email=${email}">here</a> to accept the invitation and create your account.</p>`,
    });
  }

  async sendSecondaryEmailVerification(
    email: string,
    token: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.NODEMAILER_USERNAME,
      to: email,
      subject: 'Verify your secondary email',
      html: `<p>Please verify your secondary email by clicking <a href="${process.env.CLIENT_URL}/verify-email?email=${email}&token=${token}">here</a>.</p>`,
    });
  }
}
