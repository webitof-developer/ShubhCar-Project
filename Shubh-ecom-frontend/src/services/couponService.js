import APP_CONFIG from '@/config/app.config';

const API_BASE = APP_CONFIG.api.baseUrl;

export const getPublicCoupons = async () => {
  const response = await fetch(`${API_BASE}/coupons/public`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch coupons');
  }

  return (await response.json()).data || [];
};
