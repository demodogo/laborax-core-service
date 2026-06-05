import { z } from 'zod';

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  if (value.toLowerCase() === 'true') {
    return true;
  }

  if (value.toLowerCase() === 'false') {
    return false;
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(1).default('change-me'),
  JWT_ACCESS_TTL: z.string().min(1).default('15m'),
  JWT_REFRESH_SECRET: z.string().min(1).default('change-me-too'),
  JWT_REFRESH_TTL: z.string().min(1).default('7d'),
  OUTBOX_PUBLISHER_ENABLED: booleanFromEnv.default(false),
  EVENT_BUS_TRANSPORT: z.enum(['rabbitmq']).default('rabbitmq'),
  RABBITMQ_URL: z.string().min(1).default('amqp://localhost:5672'),
  RABBITMQ_EXCHANGE: z.string().min(1).default('laborax.domain-events'),
  CORS_ALLOWED_ORIGINS: z.string().default(''),
  SWAGGER_ENABLED: booleanFromEnv.default(false),
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
  AUTH_THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60000),
  AUTH_THROTTLE_LIMIT: z.coerce.number().int().positive().default(10),
  AUTH_MAX_ACTIVE_SESSIONS_PER_USER: z.coerce.number().int().positive().default(5),
  SERVICE_CLIENT_SECRET_GRACE_PERIOD_MINUTES: z.coerce.number().int().positive().default(60),
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
  OUTBOX_BATCH_SIZE: z.coerce.number().int().positive().max(100).default(25),
  OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
  OUTBOX_RETRY_DELAY_MS: z.coerce.number().int().positive().default(30000),
}).superRefine((config, context) => {
  if (config.NODE_ENV !== 'production') {
    return;
  }

  if (!config.DATABASE_URL) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DATABASE_URL'],
      message: 'DATABASE_URL is required in production',
    });
  }

  if (config.JWT_ACCESS_SECRET === 'change-me') {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_ACCESS_SECRET'],
      message: 'JWT_ACCESS_SECRET must be changed in production',
    });
  }

  if (config.JWT_REFRESH_SECRET === 'change-me-too') {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_REFRESH_SECRET'],
      message: 'JWT_REFRESH_SECRET must be changed in production',
    });
  }

  if (config.OUTBOX_PUBLISHER_ENABLED && !config.RABBITMQ_URL) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['RABBITMQ_URL'],
      message: 'RABBITMQ_URL is required when OUTBOX_PUBLISHER_ENABLED=true',
    });
  }
});

export type EnvSchema = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvSchema {
  return envSchema.parse(config);
}
