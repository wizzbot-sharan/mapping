import { pool } from '../config/db.js';

/**
 * Get all current client records from client_ca
 */
export const getClients = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT client_id, applywizz_id, full_name, company_email, ca_id, name, email, updated_at
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
 * 2. Upsert into client_ca preserving existing CA mappings
 * 3. Strict Mirror: Delete any client_ca record whose client_id is no longer in clients_additional_info
 * 4. Return updated client_ca list
 */
export const syncClients = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. High-speed atomic Upsert from clients_additional_info into client_ca
    // Preserves existing ca_id, name, email on conflict!
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

    // 4. Return all synchronized rows
    const updatedResult = await pool.query(`
      SELECT client_id, applywizz_id, full_name, company_email, ca_id, name, email, updated_at
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
 * Assign or update CA assignment for a specific client
 */
export const assignCA = async (req, res) => {
  const { clientId } = req.params;
  const { ca_id, name, email } = req.body;

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

  try {
    const updateResult = await pool.query(
      `
      UPDATE client_ca
      SET 
        ca_id = $1,
        name = $2,
        email = $3,
        updated_at = NOW()
      WHERE client_id = $4
      RETURNING *
      `,
      [String(ca_id), name || null, email || null, String(clientId)]
    );

    if (updateResult.rows.length === 0) {
      // If client row does not exist yet, upsert it
      const upsertResult = await pool.query(
        `
        INSERT INTO client_ca (client_id, ca_id, name, email, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (client_id) DO UPDATE SET
          ca_id = EXCLUDED.ca_id,
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          updated_at = NOW()
        RETURNING *
        `,
        [String(clientId), String(ca_id), name || null, email || null]
      );

      return res.json({
        success: true,
        message: 'CA assigned successfully',
        data: upsertResult.rows[0]
      });
    }

    return res.json({
      success: true,
      message: 'CA assigned successfully',
      data: updateResult.rows[0]
    });
  } catch (error) {
    console.error('[Assign CA Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign CA: ' + error.message
    });
  }
};
