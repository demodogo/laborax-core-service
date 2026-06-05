import { boolean, pgEnum, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { idColumn, platform, timestampsColumns } from '../common';

export const userTypeEnum = pgEnum('user_type', [
  'INTERNAL',
  'CUSTOMER',
  'CONTRACTOR',
]);

export const userStatusEnum = pgEnum('user_status', [
  'PENDING',
  'ACTIVATED',
  'SUSPENDED',
  'DEACTIVATED',
]);

export const users = platform.table(
  'users',
  {
    ...idColumn,
    type: userTypeEnum('type').notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    isEmailVerified: boolean('is_email_verified').notNull().default(false),
    status: userStatusEnum('status').notNull().default('PENDING'),
    ...timestampsColumns,
  },
  (table) => [uniqueIndex('users_email_uq').on(table.email)],
);
