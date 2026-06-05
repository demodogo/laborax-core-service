import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const serviceClientStatuses = ['ACTIVE', 'REVOKED', 'DISABLED'] as const;

export class CreateServiceClientDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  clientId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(24)
  @MaxLength(255)
  clientSecret?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  allowedScopes?: string[];

  @IsOptional()
  @IsEnum(serviceClientStatuses)
  status?: (typeof serviceClientStatuses)[number];
}
