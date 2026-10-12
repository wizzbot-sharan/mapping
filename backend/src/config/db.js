import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;

const isAzureOrRemote = connectionString && (
  connectionString.includes('azure.com') ||
  connectionString.includes('sslmode=require') ||
  process.env.PGSSLMODE === 'require' ||
  process.env.NODE_ENV === 'production'
);

let activePool = null;

export const ensureDbPool = () => {
  if (!activePool) {
    const poolConfig = {
      connectionString,
      max: 3, // Minimal pool size to keep memory usage low
      idleTimeoutMillis: 5000, // Drop idle connections after 5 seconds
      connectionTimeoutMillis: 10000,
    };

    if (isAzureOrRemote) {
      poolConfig.ssl = {
        rejectUnauthorized: false
      };
    }

    activePool = new Pool(poolConfig);

    activePool.on('error', (err) => {
      console.error('[DB Pool Error]: Unexpected error on idle client', err);
    });
  }
  return activePool;
};

/**
 * Hibernates the database pool by closing all open sockets and freeing RAM.
 */
export const hibernateDbPool = async () => {
  if (activePool) {
    console.log('[DB PowerSaver]: Draining and closing active PostgreSQL sockets to minimize RAM/CPU.');
    const p = activePool;
    activePool = null;
    try {
      await p.end();
    } catch (err) {
      console.warn('[DB PowerSaver Warning]: Notice during pool drain:', err.message);
    }
  }
};

/**
 * Backwards-compatible pool proxy that lazily re-awakens the pool on any query/connect
 */
export const pool = {
  query: async (text, params) => {
    const p = ensureDbPool();
    return p.query(text, params);
  },
  connect: async () => {
    const p = ensureDbPool();
    return p.connect();
  }
};

export const query = (text, params) => pool.query(text, params);

export const checkDatabaseConnection = async () => {
  if (!connectionString) {
    console.warn('[DB Warning]: DATABASE_URL is not set in environment variables.');
    return false;
  }
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('[DB Connected]: Connected to PostgreSQL at', res.rows[0].now);
    return true;
  } catch (error) {
    console.error('[DB Error]: Failed to connect to PostgreSQL:', error.message);
    return false;
  }
};
