const CACHE_KEY = 'client_ca_list_cache_v1';
const TTL_HOURS = 8;
const TTL_MS = TTL_HOURS * 60 * 60 * 1000;

/**
 * Save CAs into localStorage with an 8-hour TTL timestamp
 */
export const setCachedCAs = (cas) => {
  try {
    const payload = {
      cas: Array.isArray(cas) ? cas : [],
      timestamp: Date.now(),
      expiresAt: Date.now() + TTL_MS
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to save CAs to localStorage:', error);
  }
};

/**
 * Retrieve cached CAs from localStorage if still valid (< 8 hours old)
 * Returns null if cache is expired or missing.
 */
export const getCachedCAs = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw);
    if (!payload || !Array.isArray(payload.cas)) return null;

    const now = Date.now();
    if (payload.expiresAt && now > payload.expiresAt) {
      console.info('CA cache has expired (> 8 hours old).');
      return null;
    }

    return payload.cas;
  } catch (error) {
    console.error('Failed to read CAs from localStorage:', error);
    return null;
  }
};

/**
 * Get detailed information about the current cache status
 */
export const getCacheStatus = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return { exists: false, isValid: false, count: 0, expiresAt: null, timeRemainingStr: null };
    }

    const payload = JSON.parse(raw);
    const now = Date.now();
    const isExpired = !payload.expiresAt || now > payload.expiresAt;
    const count = Array.isArray(payload.cas) ? payload.cas.length : 0;

    if (isExpired) {
      return { exists: true, isValid: false, count, expiresAt: payload.expiresAt, timeRemainingStr: 'Expired' };
    }

    const remainingMs = payload.expiresAt - now;
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const timeRemainingStr = `${hours}h ${minutes}m`;

    return {
      exists: true,
      isValid: true,
      count,
      expiresAt: payload.expiresAt,
      timeRemainingStr
    };
  } catch (error) {
    return { exists: false, isValid: false, count: 0, expiresAt: null, timeRemainingStr: null };
  }
};

/**
 * Clear the CA cache from localStorage
 */
export const clearCachedCAs = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear CA cache from localStorage:', error);
  }
};
