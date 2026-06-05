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

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(userTypes)
  type?: (typeof userTypes)[number];

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsEnum(userStatuses)
  status?: (typeof userStatuses)[number];
}
