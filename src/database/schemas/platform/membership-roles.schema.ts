import { primaryKey, uuid } from 'drizzle-orm/pg-core';
import { platform } from '../common';
import { memberships } from './memberships.schema';
import { roles } from './roles.schema';

export const membershipRoles = platform.table(
  'membership_roles',
  {
    membershipId: uuid('membership_id')
      .notNull()
      .references(() => memberships.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.membershipId, table.roleId] })],
);
