import { fetchWithAuth } from '@/lib/apiClient'
import { API_BASE_URL } from '@/helpers/apiBase';

export const entriesAPI = {
    list: async (params = {}, token) => {
        // Filter out empty/null values
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v != null && v !== '')
        );
        const query = new URLSearchParams(cleanParams).toString();
        const url = `${API_BASE_URL}/entries?${query}`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, { headers });
    },

    get: async (id, token) => {
        const url = `${API_BASE_URL}/entries/${id}`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, { headers });
    },

    delete: async (id, token) => {
        const url = `${API_BASE_URL}/entries/${id}`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, { method: 'DELETE', headers });
    },

    markRead: async (id, token) => {
        const url = `${API_BASE_URL}/entries/${id}/read`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, { method: 'PATCH', headers });
    },

    stats: async (token) => {
        const url = `${API_BASE_URL}/entries/stats`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, { headers });
    }
};
