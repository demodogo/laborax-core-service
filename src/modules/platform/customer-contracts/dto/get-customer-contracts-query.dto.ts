import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const customerContractStatuses = ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED'] as const;

export class GetCustomerContractsQueryDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(customerContractStatuses)
  status?: (typeof customerContractStatuses)[number];
}
