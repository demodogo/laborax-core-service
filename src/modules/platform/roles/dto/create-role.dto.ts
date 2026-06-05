import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

const roleScopes = ['GLOBAL', 'TENANT', 'COMPANY'] as const;

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsEnum(roleScopes)
  scope!: (typeof roleScopes)[number];

  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
