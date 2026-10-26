const API_BASE = '/api';

/**
 * Fetch all clients currently in client_ca table
 */
export const fetchClients = async () => {
  const res = await fetch(`${API_BASE}/clients`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch clients');
  }
  return data;
};

/**
 * Synchronize clients from clients_additional_info table
 */
export const syncClients = async () => {
  const res = await fetch(`${API_BASE}/clients/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to synchronize clients');
  }
  return data;
};

/**
 * Fetch all CAs from backend (which proxies the external CA API)
 */
export const fetchCAs = async () => {
  const res = await fetch(`${API_BASE}/cas`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch CAs');
  }
  return data;
};

/**
 * Assign or update a CA for a client (supports assignment_type: 'permanent' | 'temp')
 */
export const assignCA = async (clientId, caData) => {
  const res = await fetch(`${API_BASE}/clients/${encodeURIComponent(clientId)}/assign-ca`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(caData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to assign CA');
  }
  return data;
};

/**
 * Trigger manual reset of expired temporary CA assignments
 */
export const resetTempAssignments = async () => {
  const res = await fetch(`${API_BASE}/clients/reset-temp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return await res.json();
};

/**
 * Check backend and database health
 */
export const checkHealth = async () => {
  const res = await fetch(`${API_BASE}/health`);
  return await res.json();
};
