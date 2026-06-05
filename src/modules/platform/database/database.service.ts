import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../../database/schemas';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly pool: Pool | null;
  readonly db: NodePgDatabase<typeof schema> | null;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      this.pool = null;
      this.db = null;
      return;
    }

    this.pool = new Pool({
      connectionString,
    });
    this.db = drizzle(this.pool, { schema });
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
