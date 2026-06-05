import { text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { idColumn, platform, timestampsColumns } from '../common';

export const permissions = platform.table(
  'permissions',
  {
    ...idColumn,
    slug: varchar('slug', { length: 160 }).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    category: varchar('category', { length: 120 }).notNull(),
    description: text('description'),
    ...timestampsColumns,
  },
  (table) => [uniqueIndex('permissions_slug_uq').on(table.slug)],
);
