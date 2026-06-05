import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OutboxRabbitmqPublisher } from './publishers/outbox-rabbitmq.publisher';
import { OutboxRepository } from './repositories/outbox.repository';

@Injectable()
export class OutboxDispatcherService {
  private readonly logger = new Logger(OutboxDispatcherService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly outboxRepository: OutboxRepository,
    private readonly outboxRabbitmqPublisher: OutboxRabbitmqPublisher,
  ) {}

  async dispatchOnce(batchSize?: number) {
    const configuredBatchSize = this.configService.get<number>('OUTBOX_BATCH_SIZE', 25);
    const maxAttempts = this.configService.get<number>('OUTBOX_MAX_ATTEMPTS', 10);
    const retryDelayMs = this.configService.get<number>('OUTBOX_RETRY_DELAY_MS', 30000);
    const events = await this.outboxRepository.claimPending(
      batchSize ?? configuredBatchSize,
      maxAttempts,
    );
    let processed = 0;
    let failed = 0;

    for (const event of events) {
      try {
        await this.outboxRabbitmqPublisher.publish(event);
        await this.outboxRepository.markProcessed(event.id);
        processed += 1;
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : 'Unknown outbox publish error';
        await this.outboxRepository.markFailed(event.id, message, retryDelayMs);
        this.logger.warn(`Outbox event ${event.id} failed: ${message}`);
      }
    }

    return {
      claimed: events.length,
      processed,
      failed,
    };
  }
}
