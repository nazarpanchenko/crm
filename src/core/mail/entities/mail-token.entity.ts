import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  type TokenPayload,
  VerificationMessageTokenType,
} from 'src/shared/types/auth.types';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class MailToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  token!: string;

  @ManyToOne(() => User, (user) => user.mailTokens, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({
    type: 'enum',
    enum: VerificationMessageTokenType,
  })
  type!: VerificationMessageTokenType;

  @Column({ type: 'jsonb', nullable: true })
  payload!: TokenPayload | null;
}
