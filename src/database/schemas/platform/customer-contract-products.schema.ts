import {
  date,
  index,
  pgEnum,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { idColumn, platform, timestampsColumns } from '../common';
import { customerContracts } from './customer-contracts.schema';

export const productCodeEnum = pgEnum('product_code', ['SCC', 'SCA', 'CERTIFICAX']);

export const productStatusEnum = pgEnum('product_status', ['ACTIVE', 'INACTIVE']);

export const customerContractProductStatusEnum = pgEnum('customer_contract_product_status', [
  'ACTIVE',
  'INACTIVE',
]);

export const products = platform.table(
  'products',
  {
    ...idColumn,
    code: productCodeEnum('code').notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    description: varchar('description', { length: 255 }),
    status: productStatusEnum('status').notNull().default('ACTIVE'),
    ...timestampsColumns,
  },
  (table) => [uniqueIndex('products_code_uq').on(table.code)],
);

export const customerContractProducts = platform.table(
  'customer_contract_products',
  {
    ...idColumn,
    customerContractId: uuid('customer_contract_id')
      .notNull()
      .references(() => customerContracts.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    status: customerContractProductStatusEnum('status').notNull().default('ACTIVE'),
    startsAt: date('starts_at'),
    endsAt: date('ends_at'),
    ...timestampsColumns,
  },
  (table) => [
    uniqueIndex('customer_contract_products_contract_product_uq').on(
      table.customerContractId,
      table.productId,
    ),
    index('customer_contract_products_contract_idx').on(table.customerContractId),
    index('customer_contract_products_product_idx').on(table.productId),
  ],
);
