import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class InvitationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  token!: string;

  @Column('uuid', { nullable: true })
  workspaceId!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;
}
