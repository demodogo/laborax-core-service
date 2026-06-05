import { date, pgEnum, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { idColumn, platform, timestampsColumns } from '../common';
import { tenants } from './tenants.schema';

export const customerContractStatusEnum = pgEnum('customer_contract_status', [
  'DRAFT',
  'ACTIVE',
  'EXPIRED',
  'TERMINATED',
]);

export const customerContracts = platform.table('customer_contracts', {
  ...idColumn,
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'restrict' }),
  contractNumber: varchar('contract_number', { length: 120 }),
  status: customerContractStatusEnum('status').notNull().default('DRAFT'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  notes: text('notes'),
  ...timestampsColumns,
});
