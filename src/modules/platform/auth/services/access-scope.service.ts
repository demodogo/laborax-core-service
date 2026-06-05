import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { and, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { companies, memberships } from '../../../../database/schemas';
import { DatabaseService } from '../../database/database.service';
import type { AuthUserContext } from '../types/auth-user-context.type';

export interface EffectiveAccessScope {
  isGlobal: boolean;
  tenantIds: string[];
  companyIds: string[];
  companyPaths: string[];
  companies: Array<{
    id: string;
    tenantId: string;
    legalName: string;
    type: string;
    path: string;
    depth: number;
  }>;
}

@Injectable()
export class AccessScopeService {
  constructor(private readonly databaseService: DatabaseService) {}

  async resolve(user: AuthUserContext): Promise<EffectiveAccessScope> {
    const db = this.getDb();
    const rows = await db
      .select({
        membershipScope: memberships.scope,
        tenantId: memberships.tenantId,
        companyId: memberships.companyId,
        companyPath: companies.path,
      })
      .from(memberships)
      .leftJoin(companies, eq(companies.id, memberships.companyId))
      .where(and(eq(memberships.userId, user.sub), eq(memberships.status, 'ACTIVE')));

    const isGlobal = rows.some((row) => row.membershipScope === 'GLOBAL');

    if (isGlobal) {
      return {
        isGlobal: true,
        tenantIds: [],
        companyIds: [],
        companyPaths: [],
        companies: [],
      };
    }

    const companyIds = Array.from(
      new Set(rows.map((row) => row.companyId).filter((id): id is string => Boolean(id))),
    );
    const scopeCompanies = companyIds.length
      ? await db
          .select({
            id: companies.id,
            tenantId: companies.tenantId,
            legalName: companies.legalName,
            type: companies.type,
            path: companies.path,
            depth: companies.depth,
          })
          .from(companies)
          .where(inArray(companies.id, companyIds))
      : [];

    return {
      isGlobal: false,
      tenantIds: Array.from(
        new Set(rows.map((row) => row.tenantId).filter((id): id is string => Boolean(id))),
      ),
      companyIds,
      companyPaths: Array.from(
        new Set(
          rows.map((row) => row.companyPath).filter((path): path is string => Boolean(path)),
        ),
      ),
      companies: scopeCompanies,
    };
  }

  canAccessTenant(scope: EffectiveAccessScope, tenantId: string) {
    return scope.isGlobal || scope.tenantIds.includes(tenantId);
  }

  companyTreeFilter(scope: EffectiveAccessScope): SQL | undefined {
    if (scope.isGlobal) {
      return undefined;
    }

    const filters: SQL[] = [];

    if (scope.tenantIds.length) {
      filters.push(inArray(companies.tenantId, scope.tenantIds));
    }

    if (!scope.tenantIds.length && scope.companyPaths.length) {
      filters.push(
        or(
          ...scope.companyPaths.map((path) =>
            or(eq(companies.path, path), ilike(companies.path, `${path}/%`)),
          ),
        )!,
      );
    }

    return filters.length ? or(...filters) : undefined;
  }

  private getDb() {
    if (!this.databaseService.db) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.databaseService.db;
  }
}
