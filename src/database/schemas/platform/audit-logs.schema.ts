import { index, jsonb, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { idColumn, platform } from '../common';
import { users } from './users.schema';

export const auditLogs = platform.table(
  'audit_logs',
  {
    ...idColumn,
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    actorType: varchar('actor_type', { length: 40 }).notNull().default('USER'),
    action: varchar('action', { length: 160 }).notNull(),
    resourceType: varchar('resource_type', { length: 120 }).notNull(),
    resourceId: varchar('resource_id', { length: 120 }),
    httpMethod: varchar('http_method', { length: 12 }),
    httpPath: varchar('http_path', { length: 500 }),
    ipAddress: varchar('ip_address', { length: 80 }),
    userAgent: varchar('user_agent', { length: 500 }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  },
  (table) => ({
    actionIdx: index('audit_logs_action_idx').on(table.action),
    actorUserIdx: index('audit_logs_actor_user_id_idx').on(table.actorUserId),
    occurredAtIdx: index('audit_logs_occurred_at_idx').on(table.occurredAt),
    resourceIdx: index('audit_logs_resource_idx').on(table.resourceType, table.resourceId),
  }),
);
