import { date, pgEnum, uuid } from 'drizzle-orm/pg-core';
import { idColumn, platform, timestampsColumns } from '../common';
import { companies } from './companies.schema';
import { tenants } from './tenants.schema';
import { users } from './users.schema';

export const membershipScopeEnum = pgEnum('membership_scope', [
  'GLOBAL',
  'TENANT',
  'COMPANY',
]);

export const membershipStatusEnum = pgEnum('membership_status', [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
]);

export const memberships = platform.table('memberships', {
  ...idColumn,
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').references(() => companies.id, {
    onDelete: 'cascade',
  }),
  scope: membershipScopeEnum('scope').notNull(),
  status: membershipStatusEnum('status').notNull().default('ACTIVE'),
  validFrom: date('valid_from'),
  validTo: date('valid_to'),
  ...timestampsColumns,
});
