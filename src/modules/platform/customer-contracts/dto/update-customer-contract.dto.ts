import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

const customerContractStatuses = ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED'] as const;

export class UpdateCustomerContractDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contractNumber?: string;

  @IsOptional()
  @IsEnum(customerContractStatuses)
  status?: (typeof customerContractStatuses)[number];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
