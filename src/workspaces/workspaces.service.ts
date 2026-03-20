import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import { Repository } from 'typeorm';

import { COOKIE_MAX_AGE } from 'src/config/consts';
import { WorkspaceRole } from 'src/shared/types/auth.types';
import { MailService } from 'src/core/mail/mail.service';
import { CreateWorkspaceDto } from 'src/workspaces/dto/createWorkspace.dto';
import { Workspace } from 'src/workspaces/entities/workspaces.entity';
import { Membership } from 'src/workspaces/entities/membership.entity';
import { User } from 'src/users/entities/user.entity';
import { InvitationToken } from 'src/workspaces/entities/invitation-token.entity';

type InviteManagerResponse = {
  message: string;
  email?: string;
};

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Workspace) private workspaceRepo: Repository<Workspace>,
    @InjectRepository(Membership)
    private membershipRepo: Repository<Membership>,
    @InjectRepository(InvitationToken)
    private invitationTokenRepo: Repository<InvitationToken>,
    private mailService: MailService,
  ) {}

  async inviteManager(
    workspaceId: string,
    email: string,
  ): Promise<InviteManagerResponse> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const user = await this.userRepo.findOne({ where: { email } });
    if (user) {
      // Existing user: check for existing membership
      const existing = await this.membershipRepo.findOne({
        where: { user: { id: user.id }, workspace: { id: workspaceId } },
      });
      if (existing) return { message: 'User is already a member' };

      // Create membership
      const membership = this.membershipRepo.create({
        user,
        workspace,
        role: WorkspaceRole.MANAGER,
      });
      await this.membershipRepo.save(membership);
      return { message: `User ${email} invited as manager` };
    }

    // Non-registered user: create InvitationToken
    const token = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + Number(COOKIE_MAX_AGE));
    const invitationToken = this.invitationTokenRepo.create({
      token,
      workspaceId,
      expiresAt,
    });

    await this.invitationTokenRepo.save(invitationToken);
    await this.mailService.sendInvitation(email, token, workspace.name);
    return { message: `Invitation sent to ${email}` };
  }

  async create(workspaceData: CreateWorkspaceDto) {
    const workspace = new Workspace();
    workspace.name = workspaceData.name;
    return await this.workspaceRepo.save(workspace);
  }

  async findAll() {
    return await this.workspaceRepo.find();
  }

  async findOne(id: string): Promise<Workspace | null> {
    return await this.workspaceRepo.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.workspaceRepo.delete(id);
  }
}
