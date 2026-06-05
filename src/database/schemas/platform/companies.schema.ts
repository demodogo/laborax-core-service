import { index, integer, pgEnum, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { idColumn, platform, timestampsColumns } from '../common';
import { tenants } from './tenants.schema';

export const companyTypeEnum = pgEnum('company_type', [
  'OWNER',
  'CONTRACTOR',
  'SUBCONTRACTOR',
  'EST',
]);

export const companyStatusEnum = pgEnum('company_status', [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
]);

export const companies = platform.table(
  'companies',
  {
    ...idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'restrict' }),
    legalName: varchar('legal_name', { length: 255 }).notNull(),
    tradeName: varchar('trade_name', { length: 255 }),
    rut: varchar('rut', { length: 32 }).notNull(),
    type: companyTypeEnum('type').notNull(),
    status: companyStatusEnum('status').notNull().default('ACTIVE'),
    parentCompanyId: uuid('parent_company_id'),
    path: varchar('path', { length: 2048 }).notNull(),
    depth: integer('depth').notNull().default(0),
    ...timestampsColumns,
  },
  (table) => [
    uniqueIndex('companies_tenant_rut_uq').on(table.tenantId, table.rut),
    index('companies_tenant_idx').on(table.tenantId),
    index('companies_parent_idx').on(table.parentCompanyId),
    index('companies_path_idx').on(table.path),
  ],
);
