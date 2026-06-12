import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class VerifyServiceClientDto {
  @IsString()
  @MinLength(1)
  clientId!: string;

  @IsString()
  @MinLength(1)
  clientSecret!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredScopes?: string[];
}
