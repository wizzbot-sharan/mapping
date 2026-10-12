/**
 * Fetch CA list from external API specified in CA_API_URL
 */
export const getCAs = async (req, res) => {
  const caApiUrl = process.env.CA_API_URL;
  const caApiKey = process.env.CA_API_KEY;

  if (!caApiUrl) {
    return res.status(400).json({
      success: false,
      message: 'CA_API_URL is not configured in .env. Please add CA_API_URL to your environment variables.'
    });
  }

  try {
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
      return res.status(response.status).json({
        success: false,
        message: `External CA API responded with status ${response.status}: ${errorText}`
      });
    }

    const json = await response.json();

    // Handle various response wrappers (direct array, { data: [] }, { cas: [] }, etc.)
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
      return res.status(502).json({
        success: false,
        message: 'Unexpected response structure from CA API. Expected an array of CA objects.',
        received: json
      });
    }

    // Extract name, id, email
    const cas = rawList
      .filter(item => item && (item.id !== undefined || item._id !== undefined))
      .map(item => ({
        id: String(item.id ?? item._id),
        name: String(item.name || item.full_name || item.ca_name || 'Unnamed CA'),
        email: String(item.email || item.company_email || '')
      }));

    return res.json({
      success: true,
      count: cas.length,
      data: cas
    });
  } catch (error) {
    console.error('[Fetch CAs Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch CA records from external API: ' + error.message
    });
  }
};
