import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class UserEmail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  email!: string;

  @Column({ default: false })
  isPrimary!: boolean;

  @Column({ default: false })
  isVerified!: boolean;

  @ManyToOne(() => User, (user) => user.emails, { onDelete: 'CASCADE' })
  user!: User;
}
