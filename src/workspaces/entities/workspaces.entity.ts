import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Membership } from 'src/workspaces/entities/membership.entity';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  ownerId!: string;

  @OneToMany(() => Membership, (membership) => membership.workspace)
  memberships!: Membership[];
}
