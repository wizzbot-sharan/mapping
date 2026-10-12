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

const poolConfig = {
  connectionString,
};

if (isAzureOrRemote) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[DB Pool Error]: Unexpected error on idle client', err);
});

export const query = (text, params) => pool.query(text, params);

export const checkDatabaseConnection = async () => {
  if (!connectionString) {
    console.warn('[DB Warning]: DATABASE_URL is not set in environment variables. Database operations will fail until it is provided.');
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
