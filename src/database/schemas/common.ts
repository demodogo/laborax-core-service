import {
  pgSchema,
  timestamp,
  uuid,
  type PgTableExtraConfigValue,
} from 'drizzle-orm/pg-core';

export const auth = pgSchema('auth');
export const platform = pgSchema('platform');

export const idColumn = {
  id: uuid('id').defaultRandom().primaryKey(),
};

export const timestampsColumns = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

export type TableExtraConfig = PgTableExtraConfigValue[];
