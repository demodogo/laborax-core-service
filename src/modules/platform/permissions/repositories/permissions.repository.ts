import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, eq, ilike, or, type SQL } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { permissions } from '../../../../database/schemas';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { GetPermissionsQueryDto } from '../dto/get-permissions-query.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(query: GetPermissionsQueryDto) {
    const db = this.getDb();
    const filters: SQL[] = [];

    if (query.search) {
      const searchFilter = or(
        ilike(permissions.slug, `%${query.search}%`),
        ilike(permissions.displayName, `%${query.search}%`),
      );

      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    if (query.category) {
      filters.push(eq(permissions.category, query.category));
    }

    return db
      .select()
      .from(permissions)
      .where(filters.length ? and(...filters) : undefined);
  }

  async findOne(id: string) {
    const db = this.getDb();
    const [permission] = await db
      .select()
      .from(permissions)
      .where(eq(permissions.id, id))
      .limit(1);

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async create(dto: CreatePermissionDto) {
    const db = this.getDb();
    const [existingPermission] = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.slug, dto.slug))
      .limit(1);

    if (existingPermission) {
      throw new ConflictException('Permission slug already exists');
    }

    const [permission] = await db
      .insert(permissions)
      .values({
        id: randomUUID(),
        slug: dto.slug,
        displayName: dto.displayName,
        category: dto.category,
        description: dto.description ?? null,
      })
      .returning();

    return permission;
  }

  async update(id: string, dto: UpdatePermissionDto) {
    const db = this.getDb();
    await this.findOne(id);

    const [permission] = await db
      .update(permissions)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(permissions.id, id))
      .returning();

    return permission;
  }

  private getDb() {
    if (!this.databaseService.db) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.databaseService.db;
  }
}
