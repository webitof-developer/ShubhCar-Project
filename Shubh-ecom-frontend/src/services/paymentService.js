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

export const getPaymentMethods = async () => {
  const response = await fetch(`${API_BASE}/payments/methods`);
  const { text, json } = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(json?.message || text || 'Failed to load payment methods');
  }
  return json?.data || json || null;
};

export const initiatePayment = async (accessToken, { orderId, gateway }) => {
  const response = await fetch(`${API_BASE}/payments/initiate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId, gateway }),
  });

  const { text, json } = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(json?.message || text || 'Failed to initiate payment');
  }

  return json?.data || json || null;
};

export const getPaymentStatus = async (accessToken, paymentId) => {
  const response = await fetch(`${API_BASE}/payments/${paymentId}/status`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const { text, json } = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(json?.message || text || 'Failed to fetch payment status');
  }

  return json?.data || json || null;
};

export const confirmPayment = async (accessToken, paymentId, transactionId = null) => {
  const body = transactionId ? { transactionId } : {};
  
  const response = await fetch(`${API_BASE}/payments/${paymentId}/confirm`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const { text, json } = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(json?.message || text || 'Failed to confirm payment');
  }

  return json?.data || json || null;
};
