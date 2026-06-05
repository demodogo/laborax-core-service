import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GetPermissionsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;
}
