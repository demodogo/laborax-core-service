import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

const serviceClientStatuses = ['ACTIVE', 'REVOKED', 'DISABLED'] as const;

export class GetServiceClientsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(serviceClientStatuses)
  status?: (typeof serviceClientStatuses)[number];
}
