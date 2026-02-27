// API helper functions for review management
import { fetchWithAuth } from '@/lib/apiClient'
import { API_BASE_URL } from '@/helpers/apiBase';

export const reviewAPI = {
    /**
     * List paginated reviews (Admin)
     * query: { page, limit, sort, etc. }
     */
    list: async (params = {}, token) => {
        const queryParams = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/reviews/admin?${queryParams}`;
        // Allow explicit token or fallback
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, { headers });
    },

    /**
     * Get review details (Admin)
     */
    get: async (id, token) => {
        const url = `${API_BASE_URL}/reviews/admin/${id}`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, { headers });
    },

    /**
     * Delete review
     */
    delete: async (id, token) => {
        const url = `${API_BASE_URL}/reviews/${id}`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, {
            method: 'DELETE',
            headers
        });
    },

    /**
     * Update review (Admin)
     */
    update: async (id, payload = {}, token) => {
        const url = `${API_BASE_URL}/reviews/${id}`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload)
        });
    }
};
