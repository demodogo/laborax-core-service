import { Module } from '@nestjs/common';
import { DatabaseModule } from '../platform/database/database.module';
import { OutboxJobsModule } from './outbox/outbox-jobs.module';

@Module({
  imports: [DatabaseModule, OutboxJobsModule],
})
export class PlatformJobsModule {}
