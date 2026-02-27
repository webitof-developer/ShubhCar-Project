// API helper functions for users/customers
import { API_BASE_URL } from '@/helpers/apiBase';
import { fetchWithAuth } from '@/lib/apiClient'

export const userAPI = {
    /**
     * List all users (customers)
     */
    list: async (params = {}, token) => {
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/users/admin?${queryString}`;
        return fetchWithAuth(url, { headers: { Authorization: `Bearer ${token}` } });
    },

    /**
     * List all users (admin)
     */
    adminList: async (params = {}, token) => {
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/users/admin?${queryString}`;
        return fetchWithAuth(url, { headers: { Authorization: `Bearer ${token}` } });
    },

    /**
     * Register a new customer
     */
    register: async (userData) => {
        const url = `${API_BASE_URL}/users/register`;
        return fetchWithAuth(url, {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    /**
     * Get user details
     */
    getById: async (id, token) => {
        const url = `${API_BASE_URL}/users/admin/${id}`;
        return fetchWithAuth(url, { headers: { Authorization: `Bearer ${token}` } });
    },

    /**
     * Get user details (admin)
     */
    adminGetById: async (id, token) => {
        const url = `${API_BASE_URL}/users/admin/${id}`;
        const response = await fetchWithAuth(url, { headers: { Authorization: `Bearer ${token}` } });
        return response.data || response.user || null;
    },



    /**
     * Create a new user (admin only)
     */
    create: async (userData, token) => {
        const url = `${API_BASE_URL}/users/admin`;
        return fetchWithAuth(url, {
            method: 'POST',
            body: JSON.stringify(userData),
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    /**
     * Update user
     */
    update: async (id, userData, token) => {
        const url = `${API_BASE_URL}/users/admin/${id}`;
        return fetchWithAuth(url, {
            method: 'PATCH',
            body: JSON.stringify(userData),
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    /**
     * Delete user
     */
    delete: async (id, token) => {
        const url = `${API_BASE_URL}/users/admin/${id}`;
        return fetchWithAuth(url, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    /**
     * Get user statistics (admin only)
     */
    getStats: async (token) => {
        const url = `${API_BASE_URL}/users/admin/counts`;
        return fetchWithAuth(url, { headers: { Authorization: `Bearer ${token}` } });
    }
};
