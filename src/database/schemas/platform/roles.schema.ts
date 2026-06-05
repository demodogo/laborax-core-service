import { sql } from 'drizzle-orm';
import { pgEnum, text, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { idColumn, platform, timestampsColumns } from '../common';
import { tenants } from './tenants.schema';

export const roleScopeEnum = pgEnum('role_scope', ['GLOBAL', 'TENANT', 'COMPANY']);

export const roles = platform.table(
  'roles',
  {
    ...idColumn,
    slug: varchar('slug', { length: 120 }).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    description: text('description'),
    scope: roleScopeEnum('scope').notNull(),
    tenantId: uuid('tenant_id').references(() => tenants.id, {
      onDelete: 'cascade',
    }),
    ...timestampsColumns,
  },
  (table) => [
    uniqueIndex('roles_global_slug_uq')
      .on(table.slug)
      .where(sql`${table.tenantId} is null`),
    uniqueIndex('roles_slug_tenant_uq').on(table.slug, table.tenantId),
  ],
);
