import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

const outboxStatuses = ['PENDING', 'PROCESSING', 'PROCESSED', 'FAILED'] as const;

export class GetOutboxEventsQueryDto {
  @IsOptional()
  @IsEnum(outboxStatuses)
  status?: (typeof outboxStatuses)[number];

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
