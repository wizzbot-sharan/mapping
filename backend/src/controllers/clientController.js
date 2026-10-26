import { pool } from '../config/db.js';

/**
 * Calculates the next 9:00 AM IST timestamp in UTC.
 * IST is UTC+5:30.
 * 9:00 AM IST = 03:30 AM UTC.
 */
export const getNext9AMIST = (referenceDate = new Date()) => {
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });

  const parts = istFormatter.formatToParts(referenceDate).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  const year = parseInt(parts.year, 10);
  const month = parseInt(parts.month, 10) - 1;
  const day = parseInt(parts.day, 10);
  const hour = parseInt(parts.hour, 10);
  const minute = parseInt(parts.minute, 10);

  // 9:00 AM IST corresponds to 03:30 AM UTC
  const targetUTC = new Date(Date.UTC(year, month, day, 3, 30, 0, 0));
  if (hour > 9 || (hour === 9 && minute >= 0)) {
    targetUTC.setUTCDate(targetUTC.getUTCDate() + 1);
  }
  return targetUTC;
};

/**
 * Reverts any expired temporary CA assignments back to their permanent CA assignment.
 * If no permanent CA was ever set, it resets to NULL.
 */
export const resetExpiredTempAssignments = async () => {
  try {
    const result = await pool.query(`
      UPDATE client_ca
      SET 
        ca_id = permanent_ca_id,
        name = permanent_name,
        email = permanent_email,
        assignment_type = 'permanent',
        temp_ca_id = NULL,
        temp_name = NULL,
        temp_email = NULL,
        temp_expires_at = NULL,
        updated_at = NOW()
      WHERE assignment_type = 'temp' AND temp_expires_at <= NOW()
      RETURNING client_id, full_name, permanent_name;
    `);

    if (result.rowCount > 0) {
      console.log(`[Temp CA Reset]: Reverted ${result.rowCount} expired temporary CA assignment(s) to permanent.`);
    }
    return result.rowCount;
  } catch (error) {
    console.error('[Temp CA Reset Error]:', error.message);
    return 0;
  }
};

/**
 * Get all current client records from client_ca.
 * Lazily resets any expired temporary assignments before querying.
 */
export const getClients = async (req, res) => {
  try {
    // Zero-latency check: Ensure expired temporary assignments are reverted first
    await resetExpiredTempAssignments();

    const result = await pool.query(`
      SELECT 
        client_id, applywizz_id, full_name, company_email, 
        ca_id, name, email,
        permanent_ca_id, permanent_name, permanent_email,
        temp_ca_id, temp_name, temp_email, temp_expires_at,
        assignment_type, updated_at
      FROM client_ca
      ORDER BY full_name ASC NULLS LAST, client_id ASC
    `);

    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('[Get Clients Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve clients: ' + error.message
    });
  }
};

/**
 * Sync clients from clients_additional_info table:
 * 1. Fetch id, full_name, applywizz_id, company_email from clients_additional_info
 * 2. Upsert into client_ca preserving existing permanent and temp CA mappings
 * 3. Strict Mirror: Delete any client_ca record whose client_id is no longer in clients_additional_info
 * 4. Return updated client_ca list
 */
export const syncClients = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. High-speed atomic Upsert from clients_additional_info into client_ca
    // Preserves existing ca_id, permanent, temp assignments on conflict!
    await client.query(`
      INSERT INTO client_ca (client_id, applywizz_id, full_name, company_email, updated_at)
      SELECT 
        id::text, 
        applywizz_id::text, 
        full_name::text, 
        company_email::text, 
        NOW()
      FROM clients_additional_info
      ON CONFLICT (client_id) DO UPDATE SET
        applywizz_id = EXCLUDED.applywizz_id,
        full_name = EXCLUDED.full_name,
        company_email = EXCLUDED.company_email,
        updated_at = NOW();
    `);

    // 2. Strict Mirror Pruning: Delete records no longer present in source table
    await client.query(`
      DELETE FROM client_ca
      WHERE NOT EXISTS (
        SELECT 1 FROM clients_additional_info 
        WHERE clients_additional_info.id::text = client_ca.client_id
      );
    `);

    await client.query('COMMIT');

    // Also run expired temp check
    await resetExpiredTempAssignments();

    // 4. Return all synchronized rows
    const updatedResult = await pool.query(`
      SELECT 
        client_id, applywizz_id, full_name, company_email, 
        ca_id, name, email,
        permanent_ca_id, permanent_name, permanent_email,
        temp_ca_id, temp_name, temp_email, temp_expires_at,
        assignment_type, updated_at
      FROM client_ca
      ORDER BY full_name ASC NULLS LAST, client_id ASC
    `);

    return res.json({
      success: true,
      message: `Synchronized ${updatedResult.rows.length} clients successfully.`,
      syncedCount: updatedResult.rows.length,
      data: updatedResult.rows
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Sync Clients Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to synchronize clients: ' + error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Assign or update CA assignment for a specific client.
 * Supports:
 * - assignment_type: 'permanent' (default) -> sets active & permanent CA, clears temp
 * - assignment_type: 'temp' -> sets active & temp CA with 9:00 AM IST expiration, preserves permanent CA
 */
export const assignCA = async (req, res) => {
  const { clientId } = req.params;
  const { ca_id, name, email, assignment_type = 'permanent' } = req.body;

  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client ID is required'
    });
  }

  if (!ca_id) {
    return res.status(400).json({
      success: false,
      message: 'CA ID is required'
    });
  }

  const isTemp = assignment_type === 'temp';

  try {
    let result;

    if (isTemp) {
      const next9am = getNext9AMIST();

      result = await pool.query(
        `
        UPDATE client_ca
        SET 
          ca_id = $1,
          name = $2,
          email = $3,
          temp_ca_id = $1,
          temp_name = $2,
          temp_email = $3,
          temp_expires_at = $4,
          assignment_type = 'temp',
          updated_at = NOW()
        WHERE client_id = $5
        RETURNING *
        `,
        [String(ca_id), name || null, email || null, next9am.toISOString(), String(clientId)]
      );

      if (result.rows.length === 0) {
        result = await pool.query(
          `
          INSERT INTO client_ca (
            client_id, ca_id, name, email,
            temp_ca_id, temp_name, temp_email, temp_expires_at,
            assignment_type, updated_at
          )
          VALUES ($1, $2, $3, $4, $2, $3, $4, $5, 'temp', NOW())
          ON CONFLICT (client_id) DO UPDATE SET
            ca_id = EXCLUDED.ca_id,
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            temp_ca_id = EXCLUDED.temp_ca_id,
            temp_name = EXCLUDED.temp_name,
            temp_email = EXCLUDED.temp_email,
            temp_expires_at = EXCLUDED.temp_expires_at,
            assignment_type = 'temp',
            updated_at = NOW()
          RETURNING *
          `,
          [String(clientId), String(ca_id), name || null, email || null, next9am.toISOString()]
        );
      }
    } else {
      // Permanent assignment
      result = await pool.query(
        `
        UPDATE client_ca
        SET 
          ca_id = $1,
          name = $2,
          email = $3,
          permanent_ca_id = $1,
          permanent_name = $2,
          permanent_email = $3,
          temp_ca_id = NULL,
          temp_name = NULL,
          temp_email = NULL,
          temp_expires_at = NULL,
          assignment_type = 'permanent',
          updated_at = NOW()
        WHERE client_id = $4
        RETURNING *
        `,
        [String(ca_id), name || null, email || null, String(clientId)]
      );

      if (result.rows.length === 0) {
        result = await pool.query(
          `
          INSERT INTO client_ca (
            client_id, ca_id, name, email,
            permanent_ca_id, permanent_name, permanent_email,
            assignment_type, updated_at
          )
          VALUES ($1, $2, $3, $4, $2, $3, $4, 'permanent', NOW())
          ON CONFLICT (client_id) DO UPDATE SET
            ca_id = EXCLUDED.ca_id,
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            permanent_ca_id = EXCLUDED.permanent_ca_id,
            permanent_name = EXCLUDED.permanent_name,
            permanent_email = EXCLUDED.permanent_email,
            temp_ca_id = NULL,
            temp_name = NULL,
            temp_email = NULL,
            temp_expires_at = NULL,
            assignment_type = 'permanent',
            updated_at = NOW()
          RETURNING *
          `,
          [String(clientId), String(ca_id), name || null, email || null]
        );
      }
    }

    return res.json({
      success: true,
      message: isTemp
        ? 'CA temporarily assigned (resets at 9:00 AM IST)'
        : 'CA permanently assigned',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[Assign CA Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign CA: ' + error.message
    });
  }
};

/**
 * Explicit endpoint to trigger reset of expired temporary assignments
 * Useful for scheduled cron pings (Railway, GitHub Actions, cron-job.org)
 */
export const manualResetTemp = async (req, res) => {
  try {
    const resetCount = await resetExpiredTempAssignments();
    return res.json({
      success: true,
      message: `Reset executed. ${resetCount} temporary assignments reverted to permanent.`,
      resetCount
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to trigger reset: ' + error.message
    });
  }
};
