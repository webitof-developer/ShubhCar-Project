// API helper functions for brands management
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const fetchWithAuth = async (url, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
};

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
