import { DEFAULT_PORT } from '../common/constants/service.constants';

export interface AppEnv {
  nodeEnv: string;
  port: number;
  databaseUrl?: string;
  jwtAccessSecret: string;
  jwtAccessTtl: string;
  jwtRefreshSecret: string;
  jwtRefreshTtl: string;
  corsAllowedOrigins: string[];
  swaggerEnabled: boolean;
  outboxPublisherEnabled: boolean;
  serviceClientSecretGracePeriodMinutes: number;
  eventBusTransport: string;
  rabbitmqUrl: string;
  rabbitmqExchange: string;
  outboxPollIntervalMs: number;
  outboxBatchSize: number;
  outboxMaxAttempts: number;
  outboxRetryDelayMs: number;
}

export function resolveEnv(env: NodeJS.ProcessEnv): AppEnv {
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: parsePort(env.PORT),
    databaseUrl: env.DATABASE_URL,
    jwtAccessSecret: env.JWT_ACCESS_SECRET ?? 'change-me',
    jwtAccessTtl: env.JWT_ACCESS_TTL ?? '15m',
    jwtRefreshSecret: env.JWT_REFRESH_SECRET ?? 'change-me-too',
    jwtRefreshTtl: env.JWT_REFRESH_TTL ?? '7d',
    corsAllowedOrigins: parseList(env.CORS_ALLOWED_ORIGINS),
    swaggerEnabled: env.SWAGGER_ENABLED === 'true',
    outboxPublisherEnabled: env.OUTBOX_PUBLISHER_ENABLED === 'true',
    serviceClientSecretGracePeriodMinutes: parsePositiveInt(
      env.SERVICE_CLIENT_SECRET_GRACE_PERIOD_MINUTES,
      60,
    ),
    eventBusTransport: env.EVENT_BUS_TRANSPORT ?? 'rabbitmq',
    rabbitmqUrl: env.RABBITMQ_URL ?? 'amqp://localhost:5672',
    rabbitmqExchange: env.RABBITMQ_EXCHANGE ?? 'laborax.domain-events',
    outboxPollIntervalMs: parsePositiveInt(env.OUTBOX_POLL_INTERVAL_MS, 5000),
    outboxBatchSize: parsePositiveInt(env.OUTBOX_BATCH_SIZE, 25),
    outboxMaxAttempts: parsePositiveInt(env.OUTBOX_MAX_ATTEMPTS, 10),
    outboxRetryDelayMs: parsePositiveInt(env.OUTBOX_RETRY_DELAY_MS, 30000),
  };
}

function parseList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePort(value: string | undefined): number {
  if (!value) {
    return DEFAULT_PORT;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue) || parsedValue <= 0) {
    return DEFAULT_PORT;
  }

  return parsedValue;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}
