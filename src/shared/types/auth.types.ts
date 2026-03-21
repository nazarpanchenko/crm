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

export type AuthRequest = Request & {
  user?: {
    sub: string;
    emailVerified: boolean;
    memberships: { workspaceId: string; role: WorkspaceRole }[];
  };
};

export type TokenPayload = { id?: string; email?: string };
