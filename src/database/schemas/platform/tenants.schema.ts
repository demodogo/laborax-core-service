import { pgEnum, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { idColumn, platform, timestampsColumns } from '../common';

export const tenantStatusEnum = pgEnum('tenant_status', [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
]);

export const tenants = platform.table(
  'tenants',
  {
    ...idColumn,
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull(),
    status: tenantStatusEnum('status').notNull().default('ACTIVE'),
    ...timestampsColumns,
  },
  (table) => [
    uniqueIndex('tenants_slug_uq').on(table.slug),
    uniqueIndex('tenants_name_uq').on(table.name),
  ],
);
