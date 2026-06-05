import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schemas';

export interface SeedContext {
  db: ReturnType<typeof drizzle<typeof schema>>;
  pool: Pool;
}

export function createSeedContext(): SeedContext {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run seeds');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  return {
    db: drizzle(pool, { schema }),
    pool,
  };
}
