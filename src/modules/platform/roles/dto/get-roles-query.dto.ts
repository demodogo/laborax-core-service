import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const roleScopes = ['GLOBAL', 'TENANT', 'COMPANY'] as const;

export class GetRolesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(roleScopes)
  scope?: (typeof roleScopes)[number];

  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
