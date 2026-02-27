import { fetchWithAuth } from '@/lib/apiClient'
import { API_BASE_URL } from '@/helpers/apiBase';

export const taxAPI = {
  listSlabs: async (token) => {
    const url = `${API_BASE_URL}/tax/slabs`;
    return fetchWithAuth(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  createSlab: async (payload, token) => {
    const url = `${API_BASE_URL}/tax/slabs`;
    return fetchWithAuth(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  },
  updateSlab: async (id, payload, token) => {
    const url = `${API_BASE_URL}/tax/slabs/${id}`;
    return fetchWithAuth(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  },
  removeSlab: async (id, token) => {
    const url = `${API_BASE_URL}/tax/slabs/${id}`;
    return fetchWithAuth(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
