import { and, asc, eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import {
  membershipRoles,
  memberships,
  permissions,
  rolePermissions,
  roles,
  users,
} from '../schemas';
import type { SeedContext } from './seed-context';

const PLATFORM_ADMIN_ROLE = {
  slug: 'platform_admin',
  displayName: 'Administrador de plataforma',
  description: 'Rol administrativo global para operar core-service.',
  scope: 'GLOBAL' as const,
};

export async function seedPlatformAdmin({ db }: SeedContext) {
  const adminEmail = process.env.SEED_PLATFORM_ADMIN_EMAIL?.toLowerCase();
  const adminPassword = process.env.SEED_PLATFORM_ADMIN_PASSWORD;
  const adminFirstName = process.env.SEED_PLATFORM_ADMIN_FIRST_NAME ?? 'Platform';
  const adminLastName = process.env.SEED_PLATFORM_ADMIN_LAST_NAME ?? 'Admin';

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'SEED_PLATFORM_ADMIN_EMAIL and SEED_PLATFORM_ADMIN_PASSWORD are required',
    );
  }

  const [existingSeededRole] = await db
    .select()
    .from(roles)
    .where(and(eq(roles.slug, PLATFORM_ADMIN_ROLE.slug), eq(roles.scope, 'GLOBAL')))
    .orderBy(asc(roles.createdAt))
    .limit(1);

  const [createdRole] = existingSeededRole
    ? [existingSeededRole]
    : await db.insert(roles).values(PLATFORM_ADMIN_ROLE).returning();

  const existingRole = createdRole;

  if (!existingRole) {
    throw new Error('platform_admin role could not be created or found');
  }

  const allPermissions = await db.select().from(permissions);

  if (allPermissions.length) {
    await db
      .insert(rolePermissions)
      .values(
        allPermissions.map((permission) => ({
          roleId: existingRole.id,
          permissionId: permission.id,
        })),
      )
      .onConflictDoNothing();
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const [createdUser] = await db
    .insert(users)
    .values({
      type: 'INTERNAL',
      email: adminEmail,
      passwordHash,
      firstName: adminFirstName,
      lastName: adminLastName,
      isEmailVerified: true,
      status: 'ACTIVATED',
    })
    .onConflictDoNothing()
    .returning();

  const [adminUser] = createdUser
    ? [createdUser]
    : await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

  if (!adminUser) {
    throw new Error('Platform admin user could not be created or found');
  }

  const [existingMembership] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, adminUser.id))
    .limit(1);

  const [membership] = existingMembership
    ? [existingMembership]
    : await db
        .insert(memberships)
        .values({
          userId: adminUser.id,
          scope: 'GLOBAL',
          status: 'ACTIVE',
        })
        .returning();

  await db
    .insert(membershipRoles)
    .values({
      membershipId: membership.id,
      roleId: existingRole.id,
    })
    .onConflictDoNothing();

  const rolePermissionRows = await db
    .select()
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, existingRole.id));

  return {
    adminUserId: adminUser.id,
    roleId: existingRole.id,
    assignedPermissions: rolePermissionRows.length,
  };
}
