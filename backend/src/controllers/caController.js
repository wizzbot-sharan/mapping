import { pool } from '../config/db.js';
import { resetExpiredTempAssignments } from './clientController.js';

/**
 * Helper to fetch and standardize CAs from the external CA API
 */
export const fetchStandardizedCAs = async () => {
  const caApiUrl = process.env.CA_API_URL;
  const caApiKey = process.env.CA_API_KEY;

  if (!caApiUrl) {
    throw new Error('CA_API_URL is not configured in .env. Please add CA_API_URL to your environment variables.');
  }

  const headers = {
    'Accept': 'application/json'
  };

  if (caApiKey) {
    headers['Authorization'] = `Bearer ${caApiKey}`;
    headers['x-api-key'] = caApiKey;
  }

  const response = await fetch(caApiUrl, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`External CA API responded with status ${response.status}: ${errorText}`);
  }

  const json = await response.json();

  let rawList = [];
  if (Array.isArray(json)) {
    rawList = json;
  } else if (json && Array.isArray(json.data)) {
    rawList = json.data;
  } else if (json && Array.isArray(json.cas)) {
    rawList = json.cas;
  } else if (json && Array.isArray(json.results)) {
    rawList = json.results;
  } else if (json && Array.isArray(json.items)) {
    rawList = json.items;
  } else if (json && Array.isArray(json.users)) {
    rawList = json.users;
  } else {
    throw new Error('Unexpected response structure from CA API. Expected an array of CA objects.');
  }

  return rawList
    .filter(item => item && (item.id !== undefined || item._id !== undefined))
    .map(item => ({
      id: String(item.id ?? item._id),
      name: String(item.name || item.full_name || item.ca_name || 'Unnamed CA'),
      email: String(item.email || item.company_email || '')
    }));
};

/**
 * Fetch CA list from external API specified in CA_API_URL
 */
export const getCAs = async (req, res) => {
  try {
    const cas = await fetchStandardizedCAs();
    return res.json({
      success: true,
      count: cas.length,
      data: cas
    });
  } catch (error) {
    console.error('[Fetch CAs Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch CA records: ' + error.message
    });
  }
};

/**
 * Public API Endpoint: Returns complete list of all CAs with their assigned clients
 * Each CA contains: ca_id, ca_name, ca_email, client_count, and clients array.
 * Each client in array contains: applywizz_id, client_email, full_name, assignment_type.
 * Includes all CAs from directory (even if client_count is 0).
 */
export const getCAClientMappings = async (req, res) => {
  try {
    // 1. Zero-latency cleanup: Ensure expired temporary assignments are reverted before mapping
    await resetExpiredTempAssignments();

    // 2. Fetch all CAs from external directory (with database fallback)
    let cas = [];
    try {
      cas = await fetchStandardizedCAs();
    } catch (apiErr) {
      console.warn('[CA Mappings Warning]: External CA API failed, falling back to database CAs:', apiErr.message);
      const dbCAs = await pool.query(`
        SELECT DISTINCT ca_id AS id, name, email
        FROM client_ca
        WHERE ca_id IS NOT NULL AND ca_id != ''
        ORDER BY name ASC NULLS LAST
      `);
      cas = dbCAs.rows;
    }

    // 3. Query all assigned clients from client_ca
    const clientResult = await pool.query(`
      SELECT 
        client_id, applywizz_id, full_name, company_email, 
        ca_id, name AS ca_name, email AS ca_email,
        assignment_type
      FROM client_ca
      WHERE ca_id IS NOT NULL AND ca_id != ''
      ORDER BY full_name ASC NULLS LAST, client_id ASC
    `);

    // 4. Group clients by ca_id
    const clientsByCA = {};
    for (const client of clientResult.rows) {
      const caIdKey = String(client.ca_id);
      if (!clientsByCA[caIdKey]) {
        clientsByCA[caIdKey] = [];
      }
      clientsByCA[caIdKey].push({
        applywizz_id: client.applywizz_id || null,
        client_email: client.company_email || null,
        full_name: client.full_name || null,
        assignment_type: client.assignment_type || 'permanent'
      });
    }

    // 5. Structure data with all CAs from directory
    const data = cas.map(ca => ({
      ca_id: ca.id,
      ca_name: ca.name,
      ca_email: ca.email,
      client_count: (clientsByCA[ca.id] || []).length,
      clients: clientsByCA[ca.id] || []
    }));

    // In case there are assigned clients to a CA not currently in the external list, include them too
    const externalCAIds = new Set(cas.map(c => c.id));
    for (const [caId, assignedClients] of Object.entries(clientsByCA)) {
      if (!externalCAIds.has(caId)) {
        const firstClient = clientResult.rows.find(r => String(r.ca_id) === caId);
        data.push({
          ca_id: caId,
          ca_name: firstClient?.ca_name || 'Unknown CA',
          ca_email: firstClient?.ca_email || '',
          client_count: assignedClients.length,
          clients: assignedClients
        });
      }
    }

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      total_cas: data.length,
      total_assigned_clients: clientResult.rows.length,
      data
    });
  } catch (error) {
    console.error('[CA Client Mappings Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve CA client mappings: ' + error.message
    });
  }
};
