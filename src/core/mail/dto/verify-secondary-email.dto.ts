import { IsString } from 'class-validator';

export class VerifySecondaryEmailDto {
  @IsString()
  token!: string;
}
