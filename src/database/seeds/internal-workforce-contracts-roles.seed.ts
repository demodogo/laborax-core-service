import { and, eq, inArray } from 'drizzle-orm';
import { permissions, rolePermissions, roles } from '../schemas';
import type { SeedContext } from './seed-context';

const internalRoles = [
  {
    slug: 'workforce_contracts_operator',
    displayName: 'Operador Workforce Contracts',
    description:
      'Rol interno para crear y actualizar contratos asociados a asignaciones worker-company.',
    scope: 'GLOBAL' as const,
    permissionSlugs: [
      'workforce_contracts.contracts.read',
      'workforce_contracts.contracts.create',
      'workforce_contracts.contracts.update',
      'workforce_contracts.operational_profiles.read',
      'workforce_contracts.operational_profiles.create',
      'workforce_contracts.operational_profiles.update',
    ],
  },
  {
    slug: 'workforce_contracts_auditor',
    displayName: 'Auditor Workforce Contracts',
    description:
      'Rol interno de lectura para revision y auditoria de contratos laborales y operativos.',
    scope: 'GLOBAL' as const,
    permissionSlugs: [
      'workforce_contracts.contracts.read',
      'workforce_contracts.operational_profiles.read',
    ],
  },
] as const;

export async function seedInternalWorkforceContractsRoles({ db }: SeedContext) {
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
