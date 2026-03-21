import { Request } from 'express';

export enum WorkspaceRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
}

export enum VerificationMessageTokenType {
  MAIL = 'MAIL_VERIFICATION',
  OTP = 'OTP_VERIFICATION',
  INVITE = 'INVITE_MANAGER',
}

export type TokenPayload = { id?: string; email?: string };

export type JwtPayload = {
  sub: string;
  emailVerified: boolean;
  memberships: { workspaceId: string; role: WorkspaceRole }[];
};

export type AuthRequest = Omit<Request, 'user'> & {
  user?: JwtPayload;
};
