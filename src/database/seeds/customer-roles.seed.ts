import { eq, inArray } from 'drizzle-orm';
import { permissions, rolePermissions, roles } from '../schemas';
import type { SeedContext } from './seed-context';

const CUSTOMER_ADMIN_ROLE = {
  slug: 'customer_admin',
  displayName: 'Administrador cliente',
  description: 'Rol tenant base para consultar la cuenta cliente y su organizacion.',
  scope: 'TENANT' as const,
};

const customerAdminPermissionSlugs = [
  'platform.tenants.read',
  'platform.companies.read',
  'platform.customer_contracts.read',
  'platform.users.read',
  'platform.memberships.read',
] as const;

export async function seedCustomerRoles({ db }: SeedContext) {
  const [existingRole] = await db
    .select()
    .from(roles)
    .where(eq(roles.slug, CUSTOMER_ADMIN_ROLE.slug))
    .limit(1);

  const [role] = existingRole
    ? [existingRole]
    : await db.insert(roles).values(CUSTOMER_ADMIN_ROLE).returning();

  const rolePermissionsRows = await db
    .select({ id: permissions.id })
    .from(permissions)
    .where(inArray(permissions.slug, [...customerAdminPermissionSlugs]));

  if (rolePermissionsRows.length) {
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));

    await db
      .insert(rolePermissions)
      .values(
        rolePermissionsRows.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
      )
      .onConflictDoNothing();
  }

  return {
    roleId: role.id,
    assignedPermissions: rolePermissionsRows.length,
  };
}
