import {
  IsEmail,
  IsEnum,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

const userStatuses = ['PENDING', 'ACTIVATED', 'SUSPENDED', 'DEACTIVATED'] as const;

export class CreateInternalUserDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName!: string;

  @IsEnum(userStatuses)
  status!: (typeof userStatuses)[number];

  @IsUUID()
  roleId!: string;
}
