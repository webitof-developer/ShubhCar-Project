// API helper functions for products
import { fetchWithAuth } from '@/lib/apiClient'
import { API_BASE_URL } from '@/helpers/apiBase';

export const productAPI = {
    /**
     * List all products
     */
    list: async (params = {}, token) => {
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/products?${queryString}`;
        return fetchWithAuth(url, { headers: { Authorization: `Bearer ${token}` } });
    },

    /**
     * List all products (admin)
     */
    adminList: async (params = {}, token) => {
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/products/admin/list?${queryString}`;
        return fetchWithAuth(url, { headers: { Authorization: `Bearer ${token}` } });
    },

    /**
     * Get product details
     */
    getById: async (id, token) => {
        const url = `${API_BASE_URL}/products/${id}`;
        return fetchWithAuth(url, { headers: { Authorization: `Bearer ${token}` } });
    },

    /**
     * Create product
     */
    create: async (productData, token) => {
        const url = `${API_BASE_URL}/products`;
        return fetchWithAuth(url, {
            method: 'POST',
            body: JSON.stringify(productData),
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    /**
     * Update product
     */
    update: async (id, productData, token) => {
        const url = `${API_BASE_URL}/products/${id}`;
        return fetchWithAuth(url, {
            method: 'PATCH',
            body: JSON.stringify(productData),
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    /**
     * Delete product
     */
    delete: async (id, token) => {
        const url = `${API_BASE_URL}/products/${id}`;
        return fetchWithAuth(url, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};
