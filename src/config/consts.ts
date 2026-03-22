export const JWT_ACCESS_TOKEN_EXPIRES_IN =
  process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '5m';

export const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS ?? '10', 10);

export const COOKIE_MAX_AGE = process.env.COOKIE_MAX_AGE ?? 300000;

export const JWT_REFRESH_TOKEN_EXPIRES_IN =
  process.env.JWT_REFRESH_TOKEN_EXPIRES_IN ?? 600000;

export const PASSWORD_RESET_EMAIL_EXPIRES_IN =
  process.env.PASSWORD_RESET_EMAIL_EXPIRES_IN ?? 3;

export const OTP_EXPIRES_IN = process.env.OTP_EXPIRES_IN ?? '5m';

export const NODEMAILER_PORT = process.env.NODEMAILER_PORT ?? 587;
