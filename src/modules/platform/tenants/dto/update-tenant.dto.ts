import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsSlug } from '../../../../common/validators/is-slug.validator';

const tenantStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @IsSlug()
  slug?: string;

  @IsOptional()
  @IsEnum(tenantStatuses)
  status?: (typeof tenantStatuses)[number];
}
