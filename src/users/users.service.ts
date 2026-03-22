import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { RefreshToken } from 'src/core/refresh-token/entities/refresh-token.entity';
import { Membership } from 'src/workspaces/entities/membership.entity';
import { Workspace } from 'src/workspaces/entities/workspaces.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(Membership)
    private membershipRepo: Repository<Membership>,
    @InjectRepository(Workspace)
    private workspaceRepo: Repository<Workspace>,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'emailVerified'],
    });
  }

  async findOne(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'emailVerified'],
    });
  }

  async remove(id: string): Promise<void> {
    await this.refreshTokenRepo.delete({ user: { id } });
    await this.membershipRepo.delete({ user: { id } });

    const ownedWorkspaces = await this.workspaceRepo.find({
      where: { ownerId: id },
      select: ['id', 'ownerId', 'name'],
    });
    for (const workspace of ownedWorkspaces) {
      await this.membershipRepo.delete({
        workspace: { id: workspace.id },
      });
      await this.workspaceRepo.delete(workspace.id);
    }
    await this.userRepository.delete(id);
  }
}
