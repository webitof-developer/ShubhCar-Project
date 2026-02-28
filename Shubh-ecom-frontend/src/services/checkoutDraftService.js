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

const getAuthHeaders = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
});

export const createDraft = async (accessToken, payload = {}) => {
  const response = await fetch(`${API_BASE}/checkout-drafts`, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(payload || {}),
  });

  const { text, json } = await readResponseBody(response);
  if (!response.ok || json?.success === false) {
    throw new Error(json?.message || text || 'Failed to create checkout draft');
  }
  return json?.data || json || null;
};

export const getDraft = async (accessToken, draftId) => {
  const response = await fetch(`${API_BASE}/checkout-drafts/${draftId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const { text, json } = await readResponseBody(response);
  if (!response.ok || json?.success === false) {
    throw new Error(json?.message || text || 'Failed to load checkout draft');
  }
  return json?.data || json || null;
};

export const retryPayment = async (accessToken, draftId) => {
  const response = await fetch(
    `${API_BASE}/checkout-drafts/${draftId}/retry-payment`,
    {
      method: 'POST',
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify({}),
    },
  );

  const { text, json } = await readResponseBody(response);
  if (!response.ok || json?.success === false) {
    throw new Error(json?.message || text || 'Failed to retry payment');
  }
  return json?.data || json || null;
};
