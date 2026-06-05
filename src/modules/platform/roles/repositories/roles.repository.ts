import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, isNull, or, type SQL } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import {
  permissions,
  rolePermissions,
  roles,
} from '../../../../database/schemas';
import { AssignRolePermissionDto } from '../dto/assign-role-permission.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { GetRolesQueryDto } from '../dto/get-roles-query.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@Injectable()
export class RolesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(query: GetRolesQueryDto) {
    const db = this.getDb();
    const filters: SQL[] = [];

    if (query.search) {
      const searchFilter = or(
        ilike(roles.slug, `%${query.search}%`),
        ilike(roles.displayName, `%${query.search}%`),
      );

      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    if (query.scope) {
      filters.push(eq(roles.scope, query.scope));
    }

    if (query.tenantId) {
      filters.push(eq(roles.tenantId, query.tenantId));
    }

    return db.select().from(roles).where(filters.length ? and(...filters) : undefined);
  }

  async findOne(id: string) {
    const db = this.getDb();
    const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async create(dto: CreateRoleDto) {
    const db = this.getDb();
    const tenantScopeFilter = dto.tenantId
      ? eq(roles.tenantId, dto.tenantId)
      : isNull(roles.tenantId);

    const [existingRole] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.slug, dto.slug), tenantScopeFilter))
      .limit(1);

    if (existingRole) {
      throw new ConflictException('Role slug already exists in scope');
    }

    const [role] = await db
      .insert(roles)
      .values({
        id: randomUUID(),
        slug: dto.slug,
        displayName: dto.displayName,
        description: dto.description ?? null,
        scope: dto.scope,
        tenantId: dto.tenantId ?? null,
      })
      .returning();

    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    const db = this.getDb();
    await this.findOne(id);

    const [role] = await db
      .update(roles)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id))
      .returning();

    return role;
  }

  async listPermissions(roleId: string) {
    const db = this.getDb();
    await this.findOne(roleId);

    return db
      .select({
        id: permissions.id,
        slug: permissions.slug,
        displayName: permissions.displayName,
        category: permissions.category,
        description: permissions.description,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(rolePermissions.roleId, roleId));
  }

  async assignPermission(roleId: string, dto: AssignRolePermissionDto) {
    const db = this.getDb();
    await this.findOne(roleId);

    const [permission] = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.id, dto.permissionId))
      .limit(1);

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    await db
      .insert(rolePermissions)
      .values({
        roleId,
        permissionId: dto.permissionId,
      })
      .onConflictDoNothing();

    return this.listPermissions(roleId);
  }

  async removePermission(roleId: string, permissionId: string) {
    const db = this.getDb();
    await this.findOne(roleId);

    await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId),
        ),
      );

    return this.listPermissions(roleId);
  }

  async getPermissionsByRoleIds(roleIds: string[]) {
    if (!roleIds.length) {
      return [];
    }

    const db = this.getDb();
    return db
      .select({
        roleId: rolePermissions.roleId,
        permissionId: permissions.id,
        permissionSlug: permissions.slug,
        permissionDisplayName: permissions.displayName,
        permissionCategory: permissions.category,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(inArray(rolePermissions.roleId, roleIds));
  }

  private getDb() {
    if (!this.databaseService.db) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.databaseService.db;
  }
}
