import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const serviceClientStatuses = ['ACTIVE', 'REVOKED', 'DISABLED'] as const;

export class UpdateServiceClientDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  allowedScopes?: string[];

  @IsOptional()
  @IsEnum(serviceClientStatuses)
  status?: (typeof serviceClientStatuses)[number];
}
