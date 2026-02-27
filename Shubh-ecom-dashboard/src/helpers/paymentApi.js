// API helper functions for payments
import { fetchWithAuth } from '@/lib/apiClient'
import { API_BASE_URL } from '@/helpers/apiBase';

export const paymentAPI = {
    /**
     * List paginated payments (Admin)
     */
    list: async (params = {}, token) => {
        const queryParams = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/payments/admin/list?${queryParams}`;
        // Allow passing token explicitly or fallback to getAuthToken
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        return fetchWithAuth(url, { headers });
    },
};
