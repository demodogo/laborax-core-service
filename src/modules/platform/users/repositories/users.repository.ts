import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import {
  companies,
  membershipRoles,
  memberships,
  outboxEvents,
  permissions,
  rolePermissions,
  roles,
  tenants,
  users,
} from '../../../../database/schemas';
import { CreateUserDto } from '../dto/create-user.dto';
import { CreateInternalUserDto } from '../dto/create-internal-user.dto';
import { GetUsersQueryDto } from '../dto/get-users-query.dto';
import { UpdateUserCredentialsDto } from '../dto/update-user-credentials.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import type { EffectiveAccessScope } from '../../auth/services/access-scope.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(query: GetUsersQueryDto, scope?: EffectiveAccessScope) {
    const db = this.getDb();
    const filters: SQL[] = [];

    if (query.search) {
      const searchFilter = or(
        ilike(users.email, `%${query.search}%`),
        ilike(users.firstName, `%${query.search}%`),
        ilike(users.lastName, `%${query.search}%`),
      );

      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    if (query.email) filters.push(eq(users.email, query.email.toLowerCase()));
    if (query.type) filters.push(eq(users.type, query.type));
    if (query.status) filters.push(eq(users.status, query.status));

    if (!scope || scope.isGlobal) {
      return db
        .select({
          id: users.id,
          type: users.type,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          isEmailVerified: users.isEmailVerified,
          status: users.status,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(filters.length ? and(...filters) : undefined);
    }

    const scopeFilter = this.buildMembershipScopeFilter(scope);
    if (!scopeFilter) {
      return [];
    }

    return db
      .select({
        id: users.id,
        type: users.type,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isEmailVerified: users.isEmailVerified,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .innerJoin(memberships, eq(memberships.userId, users.id))
      .leftJoin(companies, eq(companies.id, memberships.companyId))
      .where(and(...filters, scopeFilter, eq(memberships.status, 'ACTIVE')));
  }

  async findOne(id: string, scope?: EffectiveAccessScope) {
    const db = this.getDb();

    if (scope && !scope.isGlobal) {
      const scopeFilter = this.buildMembershipScopeFilter(scope);
      if (!scopeFilter) {
        throw new NotFoundException('User not found');
      }

      const [scopedUser] = await db
        .select({
          id: users.id,
          type: users.type,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          isEmailVerified: users.isEmailVerified,
          status: users.status,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .innerJoin(memberships, eq(memberships.userId, users.id))
        .leftJoin(companies, eq(companies.id, memberships.companyId))
        .where(and(eq(users.id, id), scopeFilter, eq(memberships.status, 'ACTIVE')))
        .limit(1);

      if (!scopedUser) {
        throw new NotFoundException('User not found');
      }

      return scopedUser;
    }

    const [user] = await db
      .select({
        id: users.id,
        type: users.type,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isEmailVerified: users.isEmailVerified,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(dto: CreateUserDto, passwordHash: string) {
    const db = this.getDb();
    const email = dto.email.toLowerCase();
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      throw new ConflictException('User email already exists');
    }

    const [user] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        type: dto.type,
        email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        status: dto.status ?? 'PENDING',
      })
      .returning({
        id: users.id,
        type: users.type,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isEmailVerified: users.isEmailVerified,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return user;
  }

  async createInternalUser(
    dto: CreateInternalUserDto & { type: 'INTERNAL' },
    passwordHash: string,
  ) {
    const db = this.getDb();
    const email = dto.email.toLowerCase();

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      throw new ConflictException('User email already exists');
    }

    const [role] = await db.select().from(roles).where(eq(roles.id, dto.roleId)).limit(1);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.scope !== 'GLOBAL') {
      throw new ConflictException('Internal onboarding requires a global role');
    }

    return db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          id: randomUUID(),
          type: 'INTERNAL',
          email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          status: dto.status,
          isEmailVerified: true,
        })
        .returning({
          id: users.id,
          type: users.type,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          isEmailVerified: users.isEmailVerified,
          status: users.status,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });

      const [membership] = await tx
        .insert(memberships)
        .values({
          id: randomUUID(),
          userId: user.id,
          scope: 'GLOBAL',
          status: 'ACTIVE',
        })
        .returning();

      await tx.insert(membershipRoles).values({
        membershipId: membership.id,
        roleId: role.id,
      });

      await tx.insert(outboxEvents).values([
        {
          aggregateType: 'user',
          aggregateId: user.id,
          eventType: 'user.created',
          payload: user,
        },
        {
          aggregateType: 'membership',
          aggregateId: membership.id,
          eventType: 'membership.created',
          payload: membership,
        },
        {
          aggregateType: 'membership',
          aggregateId: membership.id,
          eventType: 'membership.role_assigned',
          payload: {
            membershipId: membership.id,
            roleId: role.id,
          },
        },
      ]);

      return {
        user,
        membership,
        role: {
          id: role.id,
          slug: role.slug,
          displayName: role.displayName,
          scope: role.scope,
        },
      };
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const db = this.getDb();
    await this.findOne(id);

    const [user] = await db
      .update(users)
      .set({
        ...dto,
        email: dto.email ? dto.email.toLowerCase() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        type: users.type,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isEmailVerified: users.isEmailVerified,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return user;
  }

  async updateCredentials(id: string, dto: UpdateUserCredentialsDto, passwordHash: string) {
    const db = this.getDb();
    await this.findOne(id);

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    return this.findOne(id);
  }

  async getContext(id: string) {
    await this.findOne(id);
    const db = this.getDb();

    const rows = await db
      .select({
        membershipId: memberships.id,
        membershipScope: memberships.scope,
        membershipStatus: memberships.status,
        tenantId: tenants.id,
        tenantName: tenants.name,
        companyId: companies.id,
        companyLegalName: companies.legalName,
        roleId: roles.id,
        roleSlug: roles.slug,
        roleDisplayName: roles.displayName,
        permissionId: permissions.id,
        permissionSlug: permissions.slug,
      })
      .from(memberships)
      .leftJoin(tenants, eq(tenants.id, memberships.tenantId))
      .leftJoin(companies, eq(companies.id, memberships.companyId))
      .leftJoin(membershipRoles, eq(membershipRoles.membershipId, memberships.id))
      .leftJoin(roles, eq(roles.id, membershipRoles.roleId))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(memberships.userId, id));

    const membershipsById = new Map<
      string,
      {
        id: string;
        scope: string;
        status: string;
        tenant: { id: string; name: string } | null;
        company: { id: string; legalName: string } | null;
        roles: Array<{ id: string; slug: string; displayName: string }>;
        permissions: Array<{ id: string; slug: string }>;
      }
    >();

    for (const row of rows) {
      if (!membershipsById.has(row.membershipId)) {
        membershipsById.set(row.membershipId, {
          id: row.membershipId,
          scope: row.membershipScope,
          status: row.membershipStatus,
          tenant: row.tenantId && row.tenantName ? { id: row.tenantId, name: row.tenantName } : null,
          company:
            row.companyId && row.companyLegalName
              ? { id: row.companyId, legalName: row.companyLegalName }
              : null,
          roles: [],
          permissions: [],
        });
      }

      const membership = membershipsById.get(row.membershipId);
      if (!membership) continue;

      if (row.roleId && row.roleSlug && row.roleDisplayName) {
        const exists = membership.roles.some((role) => role.id === row.roleId);
        if (!exists) {
          membership.roles.push({
            id: row.roleId,
            slug: row.roleSlug,
            displayName: row.roleDisplayName,
          });
        }
      }

      if (row.permissionId && row.permissionSlug) {
        const exists = membership.permissions.some(
          (permission) => permission.id === row.permissionId,
        );
        if (!exists) {
          membership.permissions.push({
            id: row.permissionId,
            slug: row.permissionSlug,
          });
        }
      }
    }

    return {
      userId: id,
      memberships: Array.from(membershipsById.values()),
    };
  }

  private getDb() {
    if (!this.databaseService.db) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.databaseService.db;
  }

  private buildMembershipScopeFilter(scope: EffectiveAccessScope) {
    if (scope.tenantIds.length) {
      return inArray(memberships.tenantId, scope.tenantIds);
    }

    if (scope.companyPaths.length) {
      return or(
        ...scope.companyPaths.map((path) =>
          or(eq(companies.path, path), ilike(companies.path, `${path}/%`)),
        ),
      );
    }

    return undefined;
  }
}
