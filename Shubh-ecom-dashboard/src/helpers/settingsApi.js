// API helper functions for settings management
import { fetchWithAuth } from '@/lib/apiClient'
import { API_BASE_URL } from '@/helpers/apiBase';

export const settingsAPI = {
    /**
     * Get all settings (optionally filter by group)
     */
    list: async (group, token) => {
        const query = group ? `?group=${group}` : '';
        const url = `${API_BASE_URL}/settings${query}`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, { headers });
    },

    /**
     * Update settings in bulk
     * data: { key: value }
     */
    update: async (data, token) => {
        const url = `${API_BASE_URL}/settings`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
    }
};
