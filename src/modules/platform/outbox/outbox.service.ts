import { Injectable, Logger } from '@nestjs/common';
import { GetOutboxEventsQueryDto } from './dto/get-outbox-events-query.dto';
import { CreateOutboxEventInput, OutboxRepository } from './repositories/outbox.repository';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly outboxRepository: OutboxRepository) {}

  async publish(input: CreateOutboxEventInput) {
    try {
      return await this.outboxRepository.create(input);
    } catch (error) {
      this.logger.error('Outbox event write failed', error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  findAll(query: GetOutboxEventsQueryDto) {
    return this.outboxRepository.findAll(query);
  }

  getStats() {
    return this.outboxRepository.getStats();
  }

  requeueFailed() {
    return this.outboxRepository.requeueFailed();
  }

  recoverProcessing(olderThanSeconds = 300) {
    return this.outboxRepository.recoverProcessing(olderThanSeconds);
  }
}
