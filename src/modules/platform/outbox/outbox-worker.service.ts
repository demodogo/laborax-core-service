import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OutboxDispatcherService } from './outbox-dispatcher.service';

@Injectable()
export class OutboxWorkerService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(OutboxWorkerService.name);
  private interval?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly outboxDispatcherService: OutboxDispatcherService,
  ) {}

  onApplicationBootstrap() {
    const enabled = this.configService.get<boolean>('OUTBOX_PUBLISHER_ENABLED', false);

    if (!enabled) {
      this.logger.log('Outbox publisher job disabled');
      return;
    }

    const intervalMs = this.configService.get<number>('OUTBOX_POLL_INTERVAL_MS', 5000);
    this.interval = setInterval(() => void this.tick(), intervalMs);
    void this.tick();
    this.logger.log(`Outbox publisher job enabled with ${intervalMs}ms interval`);
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private async tick() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    try {
      await this.outboxDispatcherService.dispatchOnce();
    } catch (error) {
      this.logger.error(
        'Outbox publisher tick failed',
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.isRunning = false;
    }
  }
}
