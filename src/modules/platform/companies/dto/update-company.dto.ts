import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsChileanRut } from '../../../../common/validators/is-chilean-rut.validator';

const companyTypes = ['OWNER', 'CONTRACTOR', 'SUBCONTRACTOR', 'EST'] as const;
const companyStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  tradeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @IsChileanRut()
  rut?: string;

  @IsOptional()
  @IsEnum(companyTypes)
  type?: (typeof companyTypes)[number];

  @IsOptional()
  @IsEnum(companyStatuses)
  status?: (typeof companyStatuses)[number];

  @IsOptional()
  @IsUUID()
  parentCompanyId?: string;
}
