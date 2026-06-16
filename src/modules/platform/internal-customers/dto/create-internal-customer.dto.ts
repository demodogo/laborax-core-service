import {
  ArrayUnique,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsChileanRut } from '../../../../common/validators/is-chilean-rut.validator';
import { IsSlug } from '../../../../common/validators/is-slug.validator';

const customerProductCodes = ['SCC', 'SCA', 'CERTIFICAX'] as const;

export class CreateInternalCustomerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @IsSlug()
  slug?: string;

  @IsString()
  @MaxLength(32)
  @IsChileanRut()
  companyRut!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  companyLegalName!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  companyTradeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contractNumber?: string;

  @IsDateString()
  contractStartDate!: string;

  @IsOptional()
  @IsDateString()
  contractEndDate?: string;

  @IsOptional()
  @IsString()
  contractNotes?: string;

  @IsOptional()
  @ArrayUnique()
  @IsEnum(customerProductCodes, { each: true })
  productCodes?: (typeof customerProductCodes)[number][];

  @IsEmail()
  adminEmail!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  adminFirstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  adminLastName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  adminPassword!: string;
}
