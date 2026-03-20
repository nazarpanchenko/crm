import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

import { RefreshToken } from 'src/core/refresh-token/entities/refresh-token.entity';
import { MailToken } from 'src/core/mail/entities/mail-token.entity';
import { Membership } from 'src/workspaces/entities/membership.entity';
import { UserEmail } from 'src/users/entities/user-email.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @OneToMany(() => UserEmail, (userEmail) => userEmail.user)
  emails!: UserEmail[];

  @Column()
  passwordHash!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  otpHash!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  otpExpires!: Date | null;

  @OneToMany(() => Membership, (membership) => membership.user)
  memberships!: Membership[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => MailToken, (token) => token.user)
  mailTokens!: MailToken[];
}
