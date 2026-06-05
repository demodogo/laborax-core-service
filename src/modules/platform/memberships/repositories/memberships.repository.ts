import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  and,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
} from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import {
  companies,
  membershipRoles,
  memberships,
  permissions,
  rolePermissions,
  roles,
  tenants,
  users,
} from '../../../../database/schemas';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { CreateMembershipDto } from '../dto/create-membership.dto';
import { GetMembershipsQueryDto } from '../dto/get-memberships-query.dto';
import type { EffectiveAccessScope } from '../../auth/services/access-scope.service';

@Injectable()
export class MembershipsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(query: GetMembershipsQueryDto, scope?: EffectiveAccessScope) {
    const db = this.getDb();
    const filters: SQL[] = [];

    if (scope && !scope.isGlobal) {
      const scopeFilter = this.buildScopeFilter(scope);
      if (!scopeFilter) {
        return [];
      }
      filters.push(scopeFilter);
    }

    if (query.userId) filters.push(eq(memberships.userId, query.userId));
    if (query.tenantId) filters.push(eq(memberships.tenantId, query.tenantId));
    if (query.companyId) filters.push(eq(memberships.companyId, query.companyId));
    if (query.scope) filters.push(eq(memberships.scope, query.scope));
    if (query.status) filters.push(eq(memberships.status, query.status));

    return db
      .select({
        id: memberships.id,
        userId: memberships.userId,
        tenantId: memberships.tenantId,
        companyId: memberships.companyId,
        scope: memberships.scope,
        status: memberships.status,
        validFrom: memberships.validFrom,
        validTo: memberships.validTo,
        userEmail: users.email,
        tenantName: tenants.name,
        companyLegalName: companies.legalName,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .leftJoin(tenants, eq(tenants.id, memberships.tenantId))
      .leftJoin(companies, eq(companies.id, memberships.companyId))
      .where(filters.length ? and(...filters) : undefined);
  }

  async findOne(id: string, scope?: EffectiveAccessScope) {
    const db = this.getDb();
    const filters: SQL[] = [eq(memberships.id, id)];

    if (scope && !scope.isGlobal) {
      const scopeFilter = this.buildScopeFilter(scope);
      if (!scopeFilter) {
        throw new NotFoundException('Membership not found');
      }
      filters.push(scopeFilter);
    }

    const [membership] = await db
      .select({
        id: memberships.id,
        userId: memberships.userId,
        tenantId: memberships.tenantId,
        companyId: memberships.companyId,
        scope: memberships.scope,
        status: memberships.status,
        validFrom: memberships.validFrom,
        validTo: memberships.validTo,
        createdAt: memberships.createdAt,
        updatedAt: memberships.updatedAt,
      })
      .from(memberships)
      .leftJoin(companies, eq(companies.id, memberships.companyId))
      .where(and(...filters))
      .limit(1);

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return membership;
  }

  async create(dto: CreateMembershipDto) {
    const db = this.getDb();
    await this.assertRelatedEntities(dto);
    this.validateScope(dto.scope, dto.tenantId ?? null, dto.companyId ?? null);

    const [membership] = await db
      .insert(memberships)
      .values({
        id: randomUUID(),
        userId: dto.userId,
        tenantId: dto.tenantId ?? null,
        companyId: dto.companyId ?? null,
        scope: dto.scope,
        status: dto.status ?? 'ACTIVE',
      })
      .returning();

    return membership;
  }

  async assignRole(membershipId: string, dto: AssignRoleDto) {
    const db = this.getDb();
    const membership = await this.findOne(membershipId);
    const [role] = await db.select().from(roles).where(eq(roles.id, dto.roleId)).limit(1);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (membership.scope === 'GLOBAL' && role.scope !== 'GLOBAL') {
      throw new BadRequestException('Global membership requires global role');
    }

    if (membership.scope !== 'GLOBAL' && role.scope === 'GLOBAL') {
      throw new BadRequestException('Scoped membership cannot receive global role');
    }

    await db
      .insert(membershipRoles)
      .values({
        membershipId,
        roleId: dto.roleId,
      })
      .onConflictDoNothing();

    return this.listRoles(membershipId);
  }

  async removeRole(membershipId: string, roleId: string) {
    const db = this.getDb();
    await this.findOne(membershipId);

    await db
      .delete(membershipRoles)
      .where(
        and(
          eq(membershipRoles.membershipId, membershipId),
          eq(membershipRoles.roleId, roleId),
        ),
      );

    return this.listRoles(membershipId);
  }

  async listRoles(membershipId: string) {
    const db = this.getDb();
    await this.findOne(membershipId);

    return db
      .select({
        id: roles.id,
        slug: roles.slug,
        displayName: roles.displayName,
        scope: roles.scope,
      })
      .from(membershipRoles)
      .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
      .where(eq(membershipRoles.membershipId, membershipId));
  }

  async getEffectivePermissions(membershipId: string) {
    const db = this.getDb();
    await this.findOne(membershipId);

    return db
      .select({
        id: permissions.id,
        slug: permissions.slug,
        displayName: permissions.displayName,
        category: permissions.category,
      })
      .from(membershipRoles)
      .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(membershipRoles.membershipId, membershipId));
  }

  private async assertRelatedEntities(dto: CreateMembershipDto) {
    const db = this.getDb();

    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, dto.userId)).limit(1);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.tenantId) {
      const [tenant] = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.id, dto.tenantId))
        .limit(1);

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }
    }

    if (dto.companyId) {
      const [company] = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.id, dto.companyId))
        .limit(1);

      if (!company) {
        throw new NotFoundException('Company not found');
      }
    }
  }

  private validateScope(scope: string, tenantId: string | null, companyId: string | null) {
    if (scope === 'GLOBAL' && (tenantId || companyId)) {
      throw new BadRequestException('Global membership cannot include tenant or company');
    }

    if (scope === 'TENANT' && !tenantId) {
      throw new BadRequestException('Tenant membership requires tenantId');
    }

    if (scope === 'COMPANY' && (!tenantId || !companyId)) {
      throw new BadRequestException('Company membership requires tenantId and companyId');
    }
  }

  private getDb() {
    if (!this.databaseService.db) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.databaseService.db;
  }

  private buildScopeFilter(scope: EffectiveAccessScope) {
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
