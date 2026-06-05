import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, type Channel, type ChannelModel } from 'amqplib';
import type { ClaimedOutboxEvent } from '../repositories/outbox.repository';

@Injectable()
export class OutboxRabbitmqPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(OutboxRabbitmqPublisher.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(private readonly configService: ConfigService) {}

  async publish(event: ClaimedOutboxEvent) {
    const channel = await this.getChannel();
    const exchange = this.configService.get<string>(
      'RABBITMQ_EXCHANGE',
      'laborax.domain-events',
    );
    const routingKey = this.resolveRoutingKey(event);
    const payload = Buffer.from(JSON.stringify(this.serializeEvent(event)));
    const wasAccepted = channel.publish(exchange, routingKey, payload, {
      contentType: 'application/json',
      deliveryMode: 2,
      messageId: event.id,
      timestamp: Date.now(),
      type: event.eventType,
      headers: {
        'x-laborax-event-id': event.id,
        'x-laborax-event-type': event.eventType,
        ...event.headers,
      },
    });

    if (!wasAccepted) {
      await new Promise<void>((resolve) => channel.once('drain', resolve));
    }
  }

  async onModuleDestroy() {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  private async getChannel() {
    if (this.channel) {
      return this.channel;
    }

    const rabbitmqUrl = this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://localhost:5672',
    );
    const exchange = this.configService.get<string>(
      'RABBITMQ_EXCHANGE',
      'laborax.domain-events',
    );

    this.connection = await connect(rabbitmqUrl);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(exchange, 'topic', {
      durable: true,
    });

    this.logger.log(`RabbitMQ publisher connected (exchange=${exchange})`);
    return this.channel;
  }

  private resolveRoutingKey(event: ClaimedOutboxEvent) {
    return event.eventType.replaceAll('_', '.');
  }

  private serializeEvent(event: ClaimedOutboxEvent) {
    return {
      id: event.id,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      eventVersion: event.eventVersion,
      payload: event.payload,
      headers: event.headers,
      attempts: event.attempts,
      createdAt: event.createdAt,
    };
  }
}
