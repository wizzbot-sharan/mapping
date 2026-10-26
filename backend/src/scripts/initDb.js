import { pool } from '../config/db.js';

export const initTables = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('[DB Init]: Skipped table initialization because DATABASE_URL is not set.');
    return;
  }

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS client_ca (
      client_id TEXT PRIMARY KEY,
      applywizz_id TEXT,
      full_name TEXT,
      company_email TEXT,
      ca_id TEXT,
      name TEXT,
      email TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_client_ca_applywizz_id ON client_ca(applywizz_id);
    CREATE INDEX IF NOT EXISTS idx_client_ca_ca_id ON client_ca(ca_id);

    -- Support Permanent vs Temporary CA assignments
    ALTER TABLE client_ca ADD COLUMN IF NOT EXISTS permanent_ca_id TEXT;
    ALTER TABLE client_ca ADD COLUMN IF NOT EXISTS permanent_name TEXT;
    ALTER TABLE client_ca ADD COLUMN IF NOT EXISTS permanent_email TEXT;
    ALTER TABLE client_ca ADD COLUMN IF NOT EXISTS temp_ca_id TEXT;
    ALTER TABLE client_ca ADD COLUMN IF NOT EXISTS temp_name TEXT;
    ALTER TABLE client_ca ADD COLUMN IF NOT EXISTS temp_email TEXT;
    ALTER TABLE client_ca ADD COLUMN IF NOT EXISTS temp_expires_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE client_ca ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(20) DEFAULT 'permanent';

    CREATE INDEX IF NOT EXISTS idx_client_ca_temp_expires ON client_ca(temp_expires_at) WHERE assignment_type = 'temp';

    -- Backfill legacy records: any existing CA assignment is set as permanent
    UPDATE client_ca
    SET 
      permanent_ca_id = ca_id,
      permanent_name = name,
      permanent_email = email,
      assignment_type = 'permanent'
    WHERE permanent_ca_id IS NULL AND ca_id IS NOT NULL;
  `;

  try {
    await pool.query(createTableQuery);
    console.log('[DB Init]: Table "client_ca" and indexes verified/created successfully.');
  } catch (error) {
    console.error('[DB Init Error]: Failed to create/verify "client_ca" table:', error.message);
    throw error;
  }
};

// If run directly from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  initTables()
    .then(() => {
      console.log('[DB Init]: Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DB Init]: Script failed:', err);
      process.exit(1);
    });
}
