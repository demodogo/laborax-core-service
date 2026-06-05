import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  displayName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
