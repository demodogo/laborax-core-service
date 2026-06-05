import {
  ConflictException,
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, asc, eq, gte, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { companies, tenants } from '../../../../database/schemas';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { GetCompaniesInternalQueryDto } from '../dto/get-companies-internal-query.dto';
import { GetCompaniesQueryDto } from '../dto/get-companies-query.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import type { EffectiveAccessScope } from '../../auth/services/access-scope.service';
import { ChileanRut } from '../../../../common/domain/chilean-rut';
import { canCreateChildCompany } from '../company-hierarchy.rules';

type CompanyReadRow = {
  id: string;
  tenantId: string;
  legalName: string;
  tradeName: string | null;
  rut: string;
  type: string;
  status: string;
  parentCompanyId: string | null;
  path: string;
  depth: number;
  createdAt: Date;
  updatedAt: Date;
  tenantName: string;
  parentCompanyLegalName: string | null;
  parentCompanyType: string | null;
};

@Injectable()
export class CompaniesRepository {
  constructor(private readonly databaseService: DatabaseService) {}
  private readonly parentCompanies = alias(companies, 'parent_companies');

  async findAll(query: GetCompaniesQueryDto, scope?: EffectiveAccessScope) {
    const db = this.getDb();
    const filters: SQL[] = [];

    if (scope && !scope.isGlobal) {
      const scopeFilter = this.buildScopeFilter(scope);
      if (!scopeFilter) {
        return [];
      }
      filters.push(scopeFilter);
    }

    if (query.tenantId) {
      filters.push(eq(companies.tenantId, query.tenantId));
    }

    if (query.search) {
      const searchFilter = or(
        ilike(companies.legalName, `%${query.search}%`),
        ilike(companies.tradeName, `%${query.search}%`),
        ilike(companies.rut, `%${query.search}%`),
      );

      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    if (query.type) {
      filters.push(eq(companies.type, query.type));
    }

    if (query.status) {
      filters.push(eq(companies.status, query.status));
    }

    if (query.updatedSince) {
      filters.push(gte(companies.updatedAt, new Date(query.updatedSince)));
    }

    const limit = query.limit ?? 100;
    const offset = query.offset ?? 0;

    const rows = await db
      .select(this.companyReadSelect())
      .from(companies)
      .innerJoin(tenants, eq(tenants.id, companies.tenantId))
      .leftJoin(this.parentCompanies, eq(this.parentCompanies.id, companies.parentCompanyId))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(companies.updatedAt), asc(companies.id))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => this.toCompanyReadModel(row));
  }

  findAllInternal(query: GetCompaniesInternalQueryDto) {
    return this.findAll(query);
  }

  async findOne(id: string, scope?: EffectiveAccessScope) {
    const db = this.getDb();
    const filters: SQL[] = [eq(companies.id, id)];

    if (scope && !scope.isGlobal) {
      const scopeFilter = this.buildScopeFilter(scope);
      if (!scopeFilter) {
        throw new NotFoundException('Company not found');
      }
      filters.push(scopeFilter);
    }

    const [row] = await db
      .select(this.companyReadSelect())
      .from(companies)
      .innerJoin(tenants, eq(tenants.id, companies.tenantId))
      .leftJoin(this.parentCompanies, eq(this.parentCompanies.id, companies.parentCompanyId))
      .where(and(...filters))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Company not found');
    }

    return this.toCompanyReadModel(row);
  }

  async create(dto: CreateCompanyDto) {
    const db = this.getDb();
    const normalizedRut = ChileanRut.normalize(dto.rut);

    if (dto.type === 'OWNER') {
      throw new BadRequestException('Owner companies must be created through internal customer onboarding');
    }

    if (!dto.parentCompanyId) {
      throw new BadRequestException('Parent company is required for non-owner companies');
    }

    const existing = await db
      .select({ id: companies.id })
      .from(companies)
      .where(and(eq(companies.tenantId, dto.tenantId), eq(companies.rut, normalizedRut)))
      .limit(1);

    if (existing.length) {
      throw new ConflictException('Company rut already exists for tenant');
    }

    const parentCompany = dto.parentCompanyId
      ? await this.findOneForHierarchy(dto.parentCompanyId)
      : null;

    if (!parentCompany || parentCompany.tenantId !== dto.tenantId) {
      throw new BadRequestException('Parent company must belong to the same tenant');
    }

    if (!canCreateChildCompany(parentCompany.type, dto.type)) {
      throw new BadRequestException(`${dto.type} cannot be created under ${parentCompany.type}`);
    }

    const [company] = await db
      .insert(companies)
      .values({
        id: randomUUID(),
        tenantId: dto.tenantId,
        legalName: dto.legalName,
        tradeName: dto.tradeName ?? null,
        rut: normalizedRut,
        type: dto.type,
        status: dto.status ?? 'ACTIVE',
        parentCompanyId: dto.parentCompanyId ?? null,
        path: '/pending',
        depth: parentCompany ? parentCompany.depth + 1 : 0,
      })
      .returning();

    const normalizedPath = parentCompany
      ? `${parentCompany.path}/${company.id}`
      : `/${company.id}`;

    const [updatedCompany] = await db
      .update(companies)
      .set({
        path: normalizedPath,
        depth: parentCompany ? parentCompany.depth + 1 : 0,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, company.id))
      .returning();

    return updatedCompany;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    const db = this.getDb();
    const currentCompany = await this.findOneForHierarchy(id);
    const normalizedRut = dto.rut ? ChileanRut.normalize(dto.rut) : undefined;

    if (dto.type === 'OWNER' && currentCompany.type !== 'OWNER') {
      throw new BadRequestException('Owner companies must be created through internal customer onboarding');
    }

    const [company] = await db
      .update(companies)
      .set({
        ...dto,
        rut: normalizedRut,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id))
      .returning();

    return company;
  }

  private getDb() {
    if (!this.databaseService.db) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.databaseService.db;
  }

  private buildScopeFilter(scope: EffectiveAccessScope) {
    if (scope.tenantIds.length) {
      return inArray(companies.tenantId, scope.tenantIds);
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

  private async findOneForHierarchy(id: string) {
    const db = this.getDb();
    const [company] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  private companyReadSelect() {
    return {
      id: companies.id,
      tenantId: companies.tenantId,
      legalName: companies.legalName,
      tradeName: companies.tradeName,
      rut: companies.rut,
      type: companies.type,
      status: companies.status,
      parentCompanyId: companies.parentCompanyId,
      path: companies.path,
      depth: companies.depth,
      createdAt: companies.createdAt,
      updatedAt: companies.updatedAt,
      tenantName: tenants.name,
      parentCompanyLegalName: this.parentCompanies.legalName,
      parentCompanyType: this.parentCompanies.type,
    };
  }

  private toCompanyReadModel(row: CompanyReadRow) {
    return {
      id: row.id,
      tenantId: row.tenantId,
      legalName: row.legalName,
      tradeName: row.tradeName,
      rut: row.rut,
      type: row.type,
      status: row.status,
      parentCompanyId: row.parentCompanyId,
      path: row.path,
      depth: row.depth,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      tenant: {
        id: row.tenantId,
        name: row.tenantName,
      },
      parentCompany: row.parentCompanyId
        ? {
            id: row.parentCompanyId,
            legalName: row.parentCompanyLegalName,
            type: row.parentCompanyType,
          }
        : null,
    };
  }
}
