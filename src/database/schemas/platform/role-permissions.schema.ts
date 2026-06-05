import { primaryKey, uuid } from 'drizzle-orm/pg-core';
import { platform } from '../common';
import { permissions } from './permissions.schema';
import { roles } from './roles.schema';

export const rolePermissions = platform.table(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);
