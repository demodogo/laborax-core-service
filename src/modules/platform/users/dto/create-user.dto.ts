import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const userTypes = ['INTERNAL', 'CUSTOMER', 'CONTRACTOR'] as const;
const userStatuses = ['PENDING', 'ACTIVATED', 'SUSPENDED', 'DEACTIVATED'] as const;

export class CreateUserDto {
  @IsEnum(userTypes)
  type!: (typeof userTypes)[number];

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

  @IsOptional()
  @IsEnum(userStatuses)
  status?: (typeof userStatuses)[number];
}
