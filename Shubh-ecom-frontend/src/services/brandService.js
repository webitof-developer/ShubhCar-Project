import APP_CONFIG from '@/config/app.config';

const baseUrl = APP_CONFIG.api.baseUrl;

const getJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const message = error.message || `Request failed: ${response.statusText}`;
        throw new Error(message);
    }
    return response.json();
};

export const getManufacturerBrands = async ({ page = 1, limit = 50 } = {}) => {
    try {
        // Fetch active manufacturer brands
        const url = `${baseUrl}/brands?type=manufacturer&status=active&page=${page}&limit=${limit}`;
        const data = await getJson(url, { next: { revalidate: 0 } }); // No cache for immediate updates

        // Normalize response
        const items = data?.data?.brands || data?.data?.items || data?.data || [];
        const total = data?.data?.total || items.length;

        return {
            brands: Array.isArray(items) ? items : [],
            total: Number(total) || 0
        };
    } catch (error) {
        console.error('Failed to fetch manufacturer brands:', error);
        return { brands: [], total: 0 };
    }
};
