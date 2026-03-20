import { IsEmail } from 'class-validator';

export class AddSecondaryEmailDto {
  @IsEmail()
  email!: string;
}
