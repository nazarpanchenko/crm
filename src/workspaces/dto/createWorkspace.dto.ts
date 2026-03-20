import {
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { User } from 'src/users/entities/user.entity';

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty({ message: 'Workspace name must not be empty' })
  @MinLength(2, {
    message: 'Workspace name must be at least 2 characters long',
  })
  @MaxLength(50, { message: 'Workspace name must not exceed 50 characters' })
  name!: string;

  @IsArray({ message: 'Users must be an array' })
  @ValidateNested({ each: true })
  @Type(() => User)
  users!: User[];
}
