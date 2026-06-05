import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { OutboxDispatcherService } from '../../platform/outbox/outbox-dispatcher.service';
import { OutboxWorkerService } from '../../platform/outbox/outbox-worker.service';
import { OutboxRabbitmqPublisher } from '../../platform/outbox/publishers/outbox-rabbitmq.publisher';
import { OutboxRepository } from '../../platform/outbox/repositories/outbox.repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    OutboxRepository,
    OutboxDispatcherService,
    OutboxRabbitmqPublisher,
    OutboxWorkerService,
  ],
})
export class OutboxJobsModule {}
