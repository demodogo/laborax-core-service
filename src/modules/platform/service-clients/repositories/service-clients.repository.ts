import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, desc, eq, gt, ilike, isNull, or, type SQL } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import {
  serviceClients,
  serviceClientSecrets,
} from '../../../../database/schemas';
import { CreateServiceClientDto } from '../dto/create-service-client.dto';
import { GetServiceClientsQueryDto } from '../dto/get-service-clients-query.dto';
import { UpdateServiceClientDto } from '../dto/update-service-client.dto';

type ServiceClientReadModel = {
  id: string;
  clientId: string;
  name: string;
  allowedScopes: string[];
  status: 'ACTIVE' | 'REVOKED' | 'DISABLED';
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  deactivatedAt: Date | null;
};

@Injectable()
export class ServiceClientsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(query: GetServiceClientsQueryDto) {
    const db = this.getDb();
    const filters: SQL[] = [];

    if (query.search) {
      const searchFilter = or(
        ilike(serviceClients.clientId, `%${query.search}%`),
        ilike(serviceClients.name, `%${query.search}%`),
      );

      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    if (query.status) {
      filters.push(eq(serviceClients.status, query.status));
    }

    return db
      .select(this.serviceClientSelect())
      .from(serviceClients)
      .where(filters.length ? and(...filters) : undefined);
  }

  async findOne(id: string) {
    const db = this.getDb();
    const [serviceClient] = await db
      .select(this.serviceClientSelect())
      .from(serviceClients)
      .where(eq(serviceClients.id, id))
      .limit(1);

    if (!serviceClient) {
      throw new NotFoundException('Service client not found');
    }

    const secrets = await this.findSecretSummaries(id);

    return {
      ...serviceClient,
      secrets,
    };
  }

  async create(dto: CreateServiceClientDto, secretHash: string) {
    const db = this.getDb();

    return db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: serviceClients.id })
        .from(serviceClients)
        .where(eq(serviceClients.clientId, dto.clientId))
        .limit(1);

      if (existing.length) {
        throw new ConflictException('Service client already exists');
      }

      const [serviceClient] = await tx
        .insert(serviceClients)
        .values({
          clientId: dto.clientId,
          name: dto.name,
          allowedScopes: dto.allowedScopes ?? [],
          status: dto.status ?? 'ACTIVE',
        })
        .returning(this.serviceClientSelect());

      await tx.insert(serviceClientSecrets).values({
        serviceClientId: serviceClient.id,
        secretHash,
        version: 1,
        isPrimary: true,
      });

      return {
        ...serviceClient,
        secretVersion: 1,
      };
    });
  }

  async update(id: string, dto: UpdateServiceClientDto) {
    const db = this.getDb();
    await this.findOne(id);

    const [serviceClient] = await db
      .update(serviceClients)
      .set({
        ...dto,
        ...this.resolveStatusTimestamps(dto.status),
      })
      .where(eq(serviceClients.id, id))
      .returning(this.serviceClientSelect());

    return serviceClient;
  }

  async rotateSecret(id: string, secretHash: string, gracePeriodMinutes: number) {
    const db = this.getDb();

    return db.transaction(async (tx) => {
      const [serviceClient] = await tx
        .select(this.serviceClientSelect())
        .from(serviceClients)
        .where(eq(serviceClients.id, id))
        .limit(1);

      if (!serviceClient) {
        throw new NotFoundException('Service client not found');
      }

      const now = new Date();
      const validUntil = new Date(now.getTime() + gracePeriodMinutes * 60 * 1000);

      const [latestSecret] = await tx
        .select({ version: serviceClientSecrets.version })
        .from(serviceClientSecrets)
        .where(eq(serviceClientSecrets.serviceClientId, id))
        .orderBy(desc(serviceClientSecrets.version))
        .limit(1);

      const [currentPrimarySecret] = await tx
        .select({
          id: serviceClientSecrets.id,
          version: serviceClientSecrets.version,
        })
        .from(serviceClientSecrets)
        .where(
          and(
            eq(serviceClientSecrets.serviceClientId, id),
            eq(serviceClientSecrets.isPrimary, true),
            isNull(serviceClientSecrets.revokedAt),
            or(
              isNull(serviceClientSecrets.validUntil),
              gt(serviceClientSecrets.validUntil, now),
            ),
          ),
        )
        .orderBy(desc(serviceClientSecrets.version))
        .limit(1);

      const nextVersion = (latestSecret?.version ?? 0) + 1;

      const [newSecret] = await tx
        .insert(serviceClientSecrets)
        .values({
          serviceClientId: id,
          secretHash,
          version: nextVersion,
          isPrimary: true,
          validFrom: now,
        })
        .returning({
          id: serviceClientSecrets.id,
          version: serviceClientSecrets.version,
        });

      if (currentPrimarySecret) {
        await tx
          .update(serviceClientSecrets)
          .set({
            isPrimary: false,
            validUntil,
            replacedBySecretId: newSecret.id,
          })
          .where(eq(serviceClientSecrets.id, currentPrimarySecret.id));
      }

      return {
        ...serviceClient,
        secretVersion: newSecret.version,
        previousSecretVersion: currentPrimarySecret?.version ?? null,
        previousSecretValidUntil: currentPrimarySecret ? validUntil : null,
      };
    });
  }

  private async findSecretSummaries(serviceClientId: string) {
    const db = this.getDb();
    return db
      .select({
        id: serviceClientSecrets.id,
        version: serviceClientSecrets.version,
        isPrimary: serviceClientSecrets.isPrimary,
        validFrom: serviceClientSecrets.validFrom,
        validUntil: serviceClientSecrets.validUntil,
        lastUsedAt: serviceClientSecrets.lastUsedAt,
        revokedAt: serviceClientSecrets.revokedAt,
        replacedBySecretId: serviceClientSecrets.replacedBySecretId,
      })
      .from(serviceClientSecrets)
      .where(eq(serviceClientSecrets.serviceClientId, serviceClientId))
      .orderBy(desc(serviceClientSecrets.version));
  }

  private serviceClientSelect() {
    return {
      id: serviceClients.id,
      clientId: serviceClients.clientId,
      name: serviceClients.name,
      allowedScopes: serviceClients.allowedScopes,
      status: serviceClients.status,
      createdAt: serviceClients.createdAt,
      lastUsedAt: serviceClients.lastUsedAt,
      revokedAt: serviceClients.revokedAt,
      deactivatedAt: serviceClients.deactivatedAt,
    };
  }

  private resolveStatusTimestamps(status?: 'ACTIVE' | 'REVOKED' | 'DISABLED') {
    if (status === 'ACTIVE') {
      return {
        revokedAt: null,
        deactivatedAt: null,
      };
    }

    if (status === 'REVOKED') {
      return {
        revokedAt: new Date(),
        deactivatedAt: null,
      };
    }

    if (status === 'DISABLED') {
      return {
        revokedAt: null,
        deactivatedAt: new Date(),
      };
    }

    return {};
  }

  private getDb() {
    if (!this.databaseService.db) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.databaseService.db;
  }
}
