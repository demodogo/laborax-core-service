import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { OutboxController } from './outbox.controller';
import { OutboxDispatcherService } from './outbox-dispatcher.service';
import { OutboxService } from './outbox.service';
import { OutboxRabbitmqPublisher } from './publishers/outbox-rabbitmq.publisher';
import { OutboxRepository } from './repositories/outbox.repository';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [OutboxController],
  providers: [
    OutboxService,
    OutboxRepository,
    OutboxDispatcherService,
    OutboxRabbitmqPublisher,
  ],
  exports: [OutboxService, OutboxDispatcherService],
})
export class OutboxModule {}
