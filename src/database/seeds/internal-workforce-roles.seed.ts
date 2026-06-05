import { and, eq, inArray } from 'drizzle-orm';
import { permissions, rolePermissions, roles } from '../schemas';
import type { SeedContext } from './seed-context';

const internalRoles = [
  {
    slug: 'workforce_digitador',
    displayName: 'Digitador Workforce',
    description: 'Rol interno para alta y actualizacion de trabajadores, vehiculos y asignaciones.',
    scope: 'GLOBAL' as const,
    permissionSlugs: [
      'workforce.workers.read',
      'workforce.workers.create',
      'workforce.workers.update',
      'workforce.vehicles.read',
      'workforce.vehicles.create',
      'workforce.vehicles.update',
      'workforce.worker_assignments.read',
      'workforce.worker_assignments.create',
      'workforce.vehicle_assignments.read',
      'workforce.vehicle_assignments.create',
    ],
  },
  {
    slug: 'workforce_auditor',
    displayName: 'Auditor Workforce',
    description: 'Rol interno de lectura para revision y auditoria del registro canonico workforce.',
    scope: 'GLOBAL' as const,
    permissionSlugs: [
      'workforce.workers.read',
      'workforce.vehicles.read',
      'workforce.worker_assignments.read',
      'workforce.vehicle_assignments.read',
    ],
  },
] as const;

export async function seedInternalWorkforceRoles({ db }: SeedContext) {
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
