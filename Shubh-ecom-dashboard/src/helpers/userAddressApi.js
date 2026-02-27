// API helper functions for user addresses
import { fetchWithAuth } from '@/lib/apiClient'
import { API_BASE_URL } from '@/helpers/apiBase';

export const userAddressAPI = {
  adminListByUser: async (userId, token) => {
    const url = `${API_BASE_URL}/user-addresses/admin/${userId}`;
    return fetchWithAuth(url, { headers: { Authorization: `Bearer ${token}` } });
  },
};
