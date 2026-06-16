import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { and, asc, desc, eq, gt, inArray, isNull, ne, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import {
  companies,
  customerContractProducts,
  customerContracts,
  membershipRoles,
  memberships,
  permissions,
  products,
  rolePermissions,
  roles,
  serviceClients,
  serviceClientSecrets,
  sessions,
  tenants,
  users,
} from '../../../../database/schemas';

@Injectable()
export class AuthRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findUserByEmail(email: string) {
    const db = this.getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ?? null;
  }

  async findUserById(id: string) {
    const db = this.getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  }

  async createSession(input: {
    userId: string;
    refreshTokenHash: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    expiresAt: Date;
  }) {
    const db = this.getDb();
    const sessionId = randomUUID();

    const [session] = await db
      .insert(sessions)
      .values({
        id: sessionId,
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        expiresAt: input.expiresAt,
        lastUsedAt: new Date(),
      })
      .returning();

    return session;
  }

  async findActiveSessionById(sessionId: string) {
    const db = this.getDb();
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, sessionId),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return session ?? null;
  }

  async findSessionById(sessionId: string) {
    const db = this.getDb();
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    return session ?? null;
  }

  async updateSessionRefreshToken(sessionId: string, refreshTokenHash: string, expiresAt: Date) {
    const db = this.getDb();
    const [session] = await db
      .update(sessions)
      .set({
        refreshTokenHash,
        expiresAt,
        lastUsedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId))
      .returning();

    return session ?? null;
  }

  async touchSessionLastUsedAt(sessionId: string) {
    const db = this.getDb();
    await db.update(sessions).set({ lastUsedAt: new Date() }).where(eq(sessions.id, sessionId));
  }

  async markSessionRefreshReuseDetected(sessionId: string) {
    const db = this.getDb();
    await db
      .update(sessions)
      .set({
        reuseDetectedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));
  }

  async revokeSession(sessionId: string, reason?: string) {
    const db = this.getDb();
    await db
      .update(sessions)
      .set({
        revokedAt: new Date(),
        revokedReason: reason ?? 'SESSION_REVOKED',
      })
      .where(eq(sessions.id, sessionId));
  }

  async revokeAllActiveSessionsForUser(userId: string, reason?: string) {
    const db = this.getDb();
    await db
      .update(sessions)
      .set({
        revokedAt: new Date(),
        revokedReason: reason ?? 'ALL_SESSIONS_REVOKED',
      })
      .where(
        and(
          eq(sessions.userId, userId),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, new Date()),
        ),
      );
  }

  async revokeOldestActiveSessionsForUser(
    userId: string,
    keepSessionId: string,
    maxActiveSessions: number,
  ) {
    const db = this.getDb();
    const activeSessions = await db
      .select({
        id: sessions.id,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          ne(sessions.id, keepSessionId),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, new Date()),
        ),
      )
      .orderBy(asc(sessions.createdAt));

    const excessCount = activeSessions.length - Math.max(maxActiveSessions - 1, 0);
    if (excessCount <= 0) {
      return;
    }

    const sessionsToRevoke = activeSessions.slice(0, excessCount);
    await Promise.all(
      sessionsToRevoke.map((session) =>
        this.revokeSession(session.id, 'MAX_ACTIVE_SESSIONS_EXCEEDED'),
      ),
    );
  }

  async findServiceClientByClientId(clientId: string) {
    const db = this.getDb();
    const [serviceClient] = await db
      .select()
      .from(serviceClients)
      .where(eq(serviceClients.clientId, clientId))
      .limit(1);

    return serviceClient ?? null;
  }

  async findActiveSecretsForServiceClient(serviceClientId: string) {
    const db = this.getDb();
    return db
      .select({
        id: serviceClientSecrets.id,
        secretHash: serviceClientSecrets.secretHash,
        version: serviceClientSecrets.version,
        isPrimary: serviceClientSecrets.isPrimary,
      })
      .from(serviceClientSecrets)
      .where(
        and(
          eq(serviceClientSecrets.serviceClientId, serviceClientId),
          isNull(serviceClientSecrets.revokedAt),
          or(
            isNull(serviceClientSecrets.validUntil),
            gt(serviceClientSecrets.validUntil, new Date()),
          ),
        ),
      )
      .orderBy(desc(serviceClientSecrets.isPrimary), desc(serviceClientSecrets.version));
  }

  async touchServiceClientLastUsedAt(id: string) {
    const db = this.getDb();
    await db.update(serviceClients).set({ lastUsedAt: new Date() }).where(eq(serviceClients.id, id));
  }

  async touchServiceClientSecretLastUsedAt(id: string) {
    const db = this.getDb();
    await db
      .update(serviceClientSecrets)
      .set({ lastUsedAt: new Date() })
      .where(eq(serviceClientSecrets.id, id));
  }

  async getEffectivePermissionSlugsForUser(userId: string) {
    const db = this.getDb();
    const rows = await db
      .select({ slug: permissions.slug })
      .from(memberships)
      .innerJoin(membershipRoles, eq(membershipRoles.membershipId, memberships.id))
      .innerJoin(roles, eq(roles.id, membershipRoles.roleId))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(and(eq(memberships.userId, userId), eq(memberships.status, 'ACTIVE')));

    return Array.from(new Set(rows.map((row) => row.slug)));
  }

  async getUserContext(userId: string, accessScope?: { isGlobal: boolean; tenantIds: string[] }) {
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
      .where(and(eq(memberships.userId, userId), eq(memberships.status, 'ACTIVE')));

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
          tenant:
            row.tenantId && row.tenantName ? { id: row.tenantId, name: row.tenantName } : null,
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
        const exists = membership.permissions.some((permission) => permission.id === row.permissionId);
        if (!exists) {
          membership.permissions.push({
            id: row.permissionId,
            slug: row.permissionSlug,
          });
        }
      }
    }

    const productContext = await this.tryGetEnabledProductsForScope(accessScope);

    return {
      userId,
      permissions: await this.getEffectivePermissionSlugsForUser(userId),
      memberships: Array.from(membershipsById.values()),
      ...productContext,
    };
  }

  async getEnabledProductsForScope(accessScope?: { isGlobal: boolean; tenantIds: string[] }) {
    const db = this.getDb();
    const today = new Date().toISOString().slice(0, 10);
    const filters = [
      eq(customerContracts.status, 'ACTIVE'),
      eq(customerContractProducts.status, 'ACTIVE'),
      eq(products.status, 'ACTIVE'),
    ];

    if (accessScope && !accessScope.isGlobal) {
      if (!accessScope.tenantIds.length) {
        return {
          enabledProducts: [],
          tenantProducts: [],
        };
      }

      filters.push(inArray(customerContracts.tenantId, accessScope.tenantIds));
    }

    const rows = await db
      .select({
        tenantId: customerContracts.tenantId,
        productCode: products.code,
        productName: products.name,
        productDescription: products.description,
        productStatus: customerContractProducts.status,
        startsAt: customerContractProducts.startsAt,
        endsAt: customerContractProducts.endsAt,
      })
      .from(customerContracts)
      .innerJoin(
        customerContractProducts,
        eq(customerContractProducts.customerContractId, customerContracts.id),
      )
      .innerJoin(products, eq(products.id, customerContractProducts.productId))
      .where(and(...filters));

    const tenantProductsMap = new Map<
      string,
      Array<{
        code: string;
        name: string;
        description: string | null;
        status: string;
        startsAt: string | null;
        endsAt: string | null;
        enabled: boolean;
      }>
    >();
    const enabledProductsMap = new Map<
      string,
      {
        code: string;
        name: string;
        description: string | null;
      }
    >();

    for (const row of rows) {
      const enabled =
        row.productStatus === 'ACTIVE' &&
        (!row.startsAt || row.startsAt <= today) &&
        (!row.endsAt || row.endsAt >= today);

      const tenantProducts = tenantProductsMap.get(row.tenantId) ?? [];
      tenantProducts.push({
        code: row.productCode,
        name: row.productName,
        description: row.productDescription,
        status: row.productStatus,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        enabled,
      });
      tenantProductsMap.set(row.tenantId, tenantProducts);

      if (enabled && !enabledProductsMap.has(row.productCode)) {
        enabledProductsMap.set(row.productCode, {
          code: row.productCode,
          name: row.productName,
          description: row.productDescription,
        });
      }
    }

    return {
      enabledProducts: Array.from(enabledProductsMap.values()),
      tenantProducts: Array.from(tenantProductsMap.entries()).map(([tenantId, tenantProducts]) => ({
        tenantId,
        products: tenantProducts,
      })),
    };
  }

  private async tryGetEnabledProductsForScope(accessScope?: {
    isGlobal: boolean;
    tenantIds: string[];
  }) {
    try {
      return await this.getEnabledProductsForScope(accessScope);
    } catch (error) {
      if (this.isMissingProductProjectionSchemaError(error)) {
        return {
          enabledProducts: [],
          tenantProducts: [],
        };
      }

      throw error;
    }
  }

  private getDb() {
    if (!this.databaseService.db) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.databaseService.db;
  }

  private isMissingProductProjectionSchemaError(error: unknown) {
    if (!(error instanceof Error)) {
      return false;
    }

    const message = error.message.toLowerCase();

    return (
      message.includes('customer_contract_products') ||
      message.includes('platform.products') ||
      message.includes('relation') && message.includes('does not exist')
    );
  }
}
