import APP_CONFIG from '@/config/app.config';

const API_BASE = APP_CONFIG.api.baseUrl;
const readResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return { text: '', json: null };
  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
};

export const getPublicCoupons = async () => {
  const response = await fetch(`${API_BASE}/coupons/public`);
  const { text, json } = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(json?.message || text || 'Failed to fetch coupons');
  }

  return Array.isArray(json?.data) ? json.data : [];
};
