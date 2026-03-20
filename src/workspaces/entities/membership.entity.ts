import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  JoinColumn,
  Unique,
} from 'typeorm';

import { WorkspaceRole } from 'src/shared/types/auth.types';
import { User } from 'src/users/entities/user.entity';
import { Workspace } from 'src/workspaces/entities/workspaces.entity';

@Entity()
@Unique(['user', 'workspace'])
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.memberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.memberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspaceId' })
  workspace!: Workspace;

  @Column('uuid')
  workspaceId!: string;

  @Column({
    type: 'enum',
    enum: WorkspaceRole,
  })
  role!: WorkspaceRole;

  @CreateDateColumn()
  createdAt!: Date;
}
