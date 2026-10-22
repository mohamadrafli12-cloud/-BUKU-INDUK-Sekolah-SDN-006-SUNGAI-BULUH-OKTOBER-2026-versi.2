import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

export const isSqlConfigured = (): boolean => {
  return Boolean(
    process.env.SQL_HOST &&
    process.env.SQL_USER &&
    process.env.SQL_DB_NAME
  );
};

// Function to create or retrieve the connection pool using the required Object Method.
export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST || undefined,
      user: process.env.SQL_USER || undefined,
      password: process.env.SQL_PASSWORD || undefined,
      database: process.env.SQL_DB_NAME || undefined,
      max: 10,
      connectionTimeoutMillis: 5000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err: any) => {
      // Silence ECONNREFUSED if SQL credentials are not configured or instance is scaling
      if (err?.code === 'ECONNREFUSED' && !process.env.SQL_HOST) {
        return;
      }
      console.warn('SQL connection notice on idle client:', err?.message || err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance lazily
const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
