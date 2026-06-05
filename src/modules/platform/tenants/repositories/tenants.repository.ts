import {
  ConflictException,
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, asc, eq, gte, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { tenants } from '../../../../database/schemas';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { GetTenantsInternalQueryDto } from '../dto/get-tenants-internal-query.dto';
import { GetTenantsQueryDto } from '../dto/get-tenants-query.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import type { EffectiveAccessScope } from '../../auth/services/access-scope.service';
import { slugify } from '../../../../common/utils/slugify';

@Injectable()
export class TenantsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(query: GetTenantsQueryDto, scope?: EffectiveAccessScope) {
    const db = this.getDb();
    const filters: SQL[] = [];

    if (scope && !scope.isGlobal) {
      if (!scope.tenantIds.length) {
        return [];
      }

      filters.push(inArray(tenants.id, scope.tenantIds));
    }

    if (query.search) {
      const searchFilter = or(
        ilike(tenants.name, `%${query.search}%`),
        ilike(tenants.slug, `%${query.search}%`),
      );

      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    if (query.status) {
      filters.push(eq(tenants.status, query.status));
    }

    if (query.updatedSince) {
      filters.push(gte(tenants.updatedAt, new Date(query.updatedSince)));
    }

    const limit = query.limit ?? 100;
    const offset = query.offset ?? 0;

    return db
      .select()
      .from(tenants)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(tenants.updatedAt), asc(tenants.id))
      .limit(limit)
      .offset(offset);
  }

  findAllInternal(query: GetTenantsInternalQueryDto) {
    return this.findAll(query);
  }

  async findOne(id: string, scope?: EffectiveAccessScope) {
    const db = this.getDb();
    const filters: SQL[] = [eq(tenants.id, id)];

    if (scope && !scope.isGlobal) {
      filters.push(inArray(tenants.id, scope.tenantIds));
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(and(...filters))
      .limit(1);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async create(dto: CreateTenantDto) {
    const db = this.getDb();
    const slug = slugify(dto.slug ?? dto.name);

    if (!slug) {
      throw new BadRequestException('Tenant slug could not be generated');
    }

    const existing = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(or(eq(tenants.slug, slug), eq(tenants.name, dto.name)))
      .limit(1);

    if (existing.length) {
      throw new ConflictException('Tenant name or slug already exists');
    }

    const [tenant] = await db
      .insert(tenants)
      .values({
        id: randomUUID(),
        name: dto.name,
        slug,
        status: dto.status ?? 'ACTIVE',
      })
      .returning();

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const db = this.getDb();
    await this.findOne(id);

    const [tenant] = await db
      .update(tenants)
      .set({
        ...dto,
        slug: dto.slug ? slugify(dto.slug) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    return tenant;
  }

  private getDb() {
    if (!this.databaseService.db) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.databaseService.db;
  }
}
