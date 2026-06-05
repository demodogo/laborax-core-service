import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

const userTypes = ['INTERNAL', 'CUSTOMER', 'CONTRACTOR'] as const;
const userStatuses = ['PENDING', 'ACTIVATED', 'SUSPENDED', 'DEACTIVATED'] as const;

export class GetUsersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(userTypes)
  type?: (typeof userTypes)[number];

  @IsOptional()
  @IsEnum(userStatuses)
  status?: (typeof userStatuses)[number];
}
