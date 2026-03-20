import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UserIdDto {
  @IsUUID('4')
  id!: string;
}
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
  @Type(() => UserIdDto) // ← use minimal DTO, not the full entity
  users!: UserIdDto[];
}
