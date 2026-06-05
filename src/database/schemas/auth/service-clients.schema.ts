import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { auth, idColumn } from '../common';

export const serviceClientStatusEnum = pgEnum('service_client_status', [
  'ACTIVE',
  'REVOKED',
  'DISABLED',
]);

export const serviceClients = auth.table(
  'service_clients',
  {
    ...idColumn,
    clientId: varchar('client_id', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    allowedScopes: jsonb('allowed_scopes').$type<string[]>().notNull().default([]),
    status: serviceClientStatusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('service_client_client_id_uq').on(table.clientId)],
);

export const serviceClientSecrets = auth.table(
  'service_client_secrets',
  {
    ...idColumn,
    serviceClientId: uuid('service_client_id')
      .notNull()
      .references(() => serviceClients.id, { onDelete: 'cascade' }),
    secretHash: text('secret_hash').notNull(),
    version: integer('version').notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    validFrom: timestamp('valid_from', { withTimezone: true }).defaultNow().notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    replacedBySecretId: uuid('replaced_by_secret_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('service_client_secret_version_uq').on(
      table.serviceClientId,
      table.version,
    ),
    index('service_client_secret_service_client_idx').on(table.serviceClientId),
    index('service_client_secret_is_primary_idx').on(
      table.serviceClientId,
      table.isPrimary,
    ),
  ],
);
