// API helper functions for brands management
import { fetchWithAuth } from '@/lib/apiClient'
import { API_BASE_URL } from '@/helpers/apiBase';

export const brandsAPI = {
    list: async (params = {}, token) => {
        const query = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/brands?${query}`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, { headers });
    },

    create: async (data, token) => {
        const url = `${API_BASE_URL}/brands`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, { method: 'POST', headers, body: JSON.stringify(data) });
    },

    update: async (id, data, token) => {
        const url = `${API_BASE_URL}/brands/${id}`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, { method: 'PUT', headers, body: JSON.stringify(data) });
    },

    delete: async (id, token) => {
        const url = `${API_BASE_URL}/brands/${id}`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, { method: 'DELETE', headers });
    }
};
