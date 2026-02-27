// API helper functions for coupons
import { fetchWithAuth } from '@/lib/apiClient'
import { API_BASE_URL } from '@/helpers/apiBase';

export const couponAPI = {
  list: async (token) => {
    const url = `${API_BASE_URL}/coupons`;
    return fetchWithAuth(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  preview: async (payload, token) => {
    const url = `${API_BASE_URL}/coupons/preview`;
    return fetchWithAuth(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  },
};
