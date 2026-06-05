import { and, eq, inArray } from 'drizzle-orm';
import { permissions, rolePermissions, roles } from '../schemas';
import type { SeedContext } from './seed-context';

const internalRoles = [
  {
    slug: 'access_control_operator',
    displayName: 'Operador Access Control',
    description:
      'Rol interno para administrar instalaciones, checkpoints, dispositivos y registrar eventos de acceso.',
    scope: 'GLOBAL' as const,
    permissionSlugs: [
      'access_control.installations.read',
      'access_control.installations.create',
      'access_control.installations.update',
      'access_control.checkpoints.read',
      'access_control.checkpoints.create',
      'access_control.checkpoints.update',
      'access_control.devices.read',
      'access_control.devices.create',
      'access_control.devices.update',
      'access_control.events.read',
      'access_control.events.create',
    ],
  },
  {
    slug: 'access_control_auditor',
    displayName: 'Auditor Access Control',
    description:
      'Rol interno de lectura para revision y auditoria operativa de control de acceso.',
    scope: 'GLOBAL' as const,
    permissionSlugs: [
      'access_control.installations.read',
      'access_control.checkpoints.read',
      'access_control.devices.read',
      'access_control.events.read',
    ],
  },
] as const;

export async function seedInternalAccessControlRoles({ db }: SeedContext) {
  const results: Array<{ slug: string; roleId: string; assignedPermissions: number }> = [];

  for (const definition of internalRoles) {
    const [existingRole] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.slug, definition.slug), eq(roles.scope, definition.scope)))
      .limit(1);

    const [role] = existingRole
      ? [existingRole]
      : await db
          .insert(roles)
          .values({
            slug: definition.slug,
            displayName: definition.displayName,
            description: definition.description,
            scope: definition.scope,
          })
          .returning();

    const permissionRows = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.slug, [...definition.permissionSlugs]));

    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));

    if (permissionRows.length) {
      await db
        .insert(rolePermissions)
        .values(
          permissionRows.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
          })),
        )
        .onConflictDoNothing();
    }

    results.push({
      slug: definition.slug,
      roleId: role.id,
      assignedPermissions: permissionRows.length,
    });
  }

  return results;
}
