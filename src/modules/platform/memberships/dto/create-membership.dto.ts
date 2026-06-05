import { IsEnum, IsOptional, IsUUID } from 'class-validator';

const membershipScopes = ['GLOBAL', 'TENANT', 'COMPANY'] as const;
const membershipStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;

export class CreateMembershipDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsEnum(membershipScopes)
  scope!: (typeof membershipScopes)[number];

  @IsOptional()
  @IsEnum(membershipStatuses)
  status?: (typeof membershipStatuses)[number];
}
