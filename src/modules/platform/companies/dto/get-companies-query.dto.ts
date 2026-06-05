import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

const companyTypes = ['OWNER', 'CONTRACTOR', 'SUBCONTRACTOR', 'EST'] as const;
const companyStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;

export class GetCompaniesQueryDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(companyTypes)
  type?: (typeof companyTypes)[number];

  @IsOptional()
  @IsEnum(companyStatuses)
  status?: (typeof companyStatuses)[number];

  @IsOptional()
  @IsDateString()
  updatedSince?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
