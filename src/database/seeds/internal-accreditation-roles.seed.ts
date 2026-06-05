import { and, eq, inArray } from 'drizzle-orm';
import { permissions, rolePermissions, roles } from '../schemas';
import type { SeedContext } from './seed-context';

const internalRoles = [
  {
    slug: 'accreditation_operator',
    displayName: 'Operador Accreditation',
    description:
      'Rol interno para administrar requisitos, documentos, revisiones y monitoreo de acreditacion.',
    scope: 'GLOBAL' as const,
    permissionSlugs: [
      'accreditation.requirements.read',
      'accreditation.requirements.create',
      'accreditation.requirements.update',
      'accreditation.documents.read',
      'accreditation.documents.create',
      'accreditation.documents.update',
      'accreditation.reviews.read',
      'accreditation.reviews.create',
      'accreditation.reviews.update',
      'accreditation.statuses.read',
      'accreditation.alerts.read',
    ],
  },
  {
    slug: 'accreditation_auditor',
    displayName: 'Auditor Accreditation',
    description:
      'Rol interno de lectura para revisar requisitos, evidencias y estados de acreditacion.',
    scope: 'GLOBAL' as const,
    permissionSlugs: [
      'accreditation.requirements.read',
      'accreditation.documents.read',
      'accreditation.reviews.read',
      'accreditation.statuses.read',
      'accreditation.alerts.read',
    ],
  },
] as const;

export async function seedInternalAccreditationRoles({ db }: SeedContext) {
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
