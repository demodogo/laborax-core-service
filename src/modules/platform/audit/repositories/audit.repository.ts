import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { auditLogs } from '../../../../database/schemas';
import { DatabaseService } from '../../database/database.service';

export interface CreateAuditLogInput {
  actorUserId?: string | null;
  actorType?: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  httpMethod?: string;
  httpPath?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateAuditLogInput) {
    const db = this.getDb();

    const [auditLog] = await db
      .insert(auditLogs)
      .values({
        actorUserId: input.actorUserId ?? null,
        actorType: input.actorType ?? 'USER',
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        httpMethod: input.httpMethod,
        httpPath: input.httpPath,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: input.metadata ?? {},
      })
      .returning();

    return auditLog;
  }

  private getDb() {
    if (!this.databaseService.db) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.databaseService.db;
  }
}
