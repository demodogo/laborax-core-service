import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect } from 'amqplib';
import { SERVICE_NAME } from '../../../common/constants/service.constants';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  getHealth() {
    return {
      service: SERVICE_NAME,
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    const checks = {
      database: await this.checkDatabase(),
      rabbitmq: await this.checkRabbitmq(),
    };
    const isReady = Object.values(checks).every((check) =>
      ['ok', 'skipped'].includes(check.status),
    );

    return {
      service: SERVICE_NAME,
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async checkDatabase() {
    if (!this.databaseService.pool) {
      return {
        status: 'down',
        reason: 'DATABASE_URL is not configured',
      };
    }

    try {
      await this.databaseService.pool.query('select 1');
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'down',
        reason: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  private async checkRabbitmq() {
    const outboxPublisherEnabled = this.configService.get<boolean>(
      'OUTBOX_PUBLISHER_ENABLED',
      false,
    );

    if (!outboxPublisherEnabled) {
      return {
        status: 'skipped',
        reason: 'OUTBOX_PUBLISHER_ENABLED=false',
      };
    }

    try {
      const connection = await connect(
        this.configService.getOrThrow<string>('RABBITMQ_URL'),
      );
      const channel = await connection.createChannel();
      await channel.assertExchange(
        this.configService.get<string>('RABBITMQ_EXCHANGE', 'laborax.domain-events'),
        'topic',
        { durable: true },
      );
      await channel.close();
      await connection.close();
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'down',
        reason: error instanceof Error ? error.message : 'Unknown RabbitMQ error',
      };
    }
  }
}
