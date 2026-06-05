import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { outboxEvents } from '../../../../database/schemas';
import { DatabaseService } from '../../database/database.service';
import { GetOutboxEventsQueryDto } from '../dto/get-outbox-events-query.dto';

export interface CreateOutboxEventInput {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  eventVersion?: number;
  payload: Record<string, unknown>;
  headers?: Record<string, unknown>;
}

export interface ClaimedOutboxEvent {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  eventVersion: number;
  payload: Record<string, unknown>;
  headers: Record<string, unknown>;
  attempts: number;
  createdAt: Date;
}

@Injectable()
export class OutboxRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateOutboxEventInput) {
    const db = this.getDb();

    const [event] = await db
      .insert(outboxEvents)
      .values({
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        eventType: input.eventType,
        eventVersion: input.eventVersion ?? 1,
        payload: input.payload,
        headers: input.headers ?? {},
      })
      .returning();

    return event;
  }

  async claimPending(batchSize: number, maxAttempts: number) {
    const pool = this.getPool();
    const client = await pool.connect();

    try {
      await client.query('begin');

      const result = await client.query<ClaimedOutboxEvent>(
        `
          select
            id,
            aggregate_type as "aggregateType",
            aggregate_id as "aggregateId",
            event_type as "eventType",
            event_version as "eventVersion",
            payload,
            headers,
            attempts,
            created_at as "createdAt"
          from platform.outbox_events
          where status in ('PENDING', 'FAILED')
            and attempts < $1
            and available_at <= now()
          order by created_at asc
          limit $2
          for update skip locked
        `,
        [maxAttempts, batchSize],
      );

      if (!result.rows.length) {
        await client.query('commit');
        return [];
      }

      await client.query(
        `
          update platform.outbox_events
          set status = 'PROCESSING',
              attempts = attempts + 1,
              available_at = now()
          where id = any($1::uuid[])
        `,
        [result.rows.map((event) => event.id)],
      );

      await client.query('commit');
      return result.rows;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async markProcessed(id: string) {
    const db = this.getDb();

    const [event] = await db
      .update(outboxEvents)
      .set({
        status: 'PROCESSED',
        processedAt: new Date(),
        lastError: null,
      })
      .where(eq(outboxEvents.id, id))
      .returning();

    return event;
  }

  async markFailed(id: string, errorMessage: string, retryDelayMs: number) {
    const db = this.getDb();
    const availableAt = new Date(Date.now() + retryDelayMs);

    const [event] = await db
      .update(outboxEvents)
      .set({
        status: 'FAILED',
        availableAt,
        lastError: errorMessage.slice(0, 1000),
      })
      .where(eq(outboxEvents.id, id))
      .returning();

    return event;
  }

  async findAll(query: GetOutboxEventsQueryDto) {
    const db = this.getDb();
    const filters: SQL[] = [];

    if (query.status) {
      filters.push(eq(outboxEvents.status, query.status));
    }

    if (query.eventType) {
      filters.push(eq(outboxEvents.eventType, query.eventType));
    }

    return db
      .select({
        id: outboxEvents.id,
        aggregateType: outboxEvents.aggregateType,
        aggregateId: outboxEvents.aggregateId,
        eventType: outboxEvents.eventType,
        eventVersion: outboxEvents.eventVersion,
        status: outboxEvents.status,
        attempts: outboxEvents.attempts,
        availableAt: outboxEvents.availableAt,
        processedAt: outboxEvents.processedAt,
        lastError: outboxEvents.lastError,
        createdAt: outboxEvents.createdAt,
      })
      .from(outboxEvents)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(outboxEvents.createdAt))
      .limit(query.limit ?? 50);
  }

  async getStats() {
    const db = this.getDb();

    return db
      .select({
        status: outboxEvents.status,
        count: sql<number>`count(*)::int`,
      })
      .from(outboxEvents)
      .groupBy(outboxEvents.status);
  }

  async requeueFailed() {
    const db = this.getDb();

    const events = await db
      .update(outboxEvents)
      .set({
        status: 'PENDING',
        availableAt: new Date(),
        lastError: null,
      })
      .where(eq(outboxEvents.status, 'FAILED'))
      .returning({ id: outboxEvents.id });

    return {
      requeued: events.length,
    };
  }

  async recoverProcessing(olderThanSeconds: number) {
    const db = this.getDb();
    const threshold = new Date(Date.now() - olderThanSeconds * 1000);

    const events = await db
      .update(outboxEvents)
      .set({
        status: 'PENDING',
        availableAt: new Date(),
        lastError: 'Recovered from stale PROCESSING state',
      })
      .where(
        and(
          eq(outboxEvents.status, 'PROCESSING'),
          sql`${outboxEvents.availableAt} <= ${threshold}`,
        ),
      )
      .returning({ id: outboxEvents.id });

    return {
      recovered: events.length,
    };
  }

  private getDb() {
    if (!this.databaseService.db) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.databaseService.db;
  }

  private getPool() {
    if (!this.databaseService.pool) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.databaseService.pool;
  }
}
