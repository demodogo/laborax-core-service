import { index, integer, jsonb, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { idColumn, platform } from '../common';

export const outboxEvents = platform.table(
  'outbox_events',
  {
    ...idColumn,
    aggregateType: varchar('aggregate_type', { length: 120 }).notNull(),
    aggregateId: varchar('aggregate_id', { length: 120 }).notNull(),
    eventType: varchar('event_type', { length: 160 }).notNull(),
    eventVersion: integer('event_version').notNull().default(1),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    headers: jsonb('headers').$type<Record<string, unknown>>().notNull().default({}),
    status: varchar('status', { length: 40 }).notNull().default('PENDING'),
    attempts: integer('attempts').notNull().default(0),
    availableAt: timestamp('available_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    lastError: varchar('last_error', { length: 1000 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    aggregateIdx: index('outbox_events_aggregate_idx').on(table.aggregateType, table.aggregateId),
    eventTypeIdx: index('outbox_events_event_type_idx').on(table.eventType),
    statusAvailableAtIdx: index('outbox_events_status_available_at_idx').on(
      table.status,
      table.availableAt,
    ),
  }),
);
