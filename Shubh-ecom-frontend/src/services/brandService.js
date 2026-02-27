import APP_CONFIG from '@/config/app.config';
import { api } from '@/utils/apiClient';

const baseUrl = APP_CONFIG.api.baseUrl;

export const getManufacturerBrands = async ({ page = 1, limit = 50 } = {}) => {
  try {
    const data = await api.get(`${baseUrl}/brands?type=manufacturer&status=active&page=${page}&limit=${limit}`, { next: { revalidate: 0 } });
    const items = data?.brands || data?.items || (Array.isArray(data) ? data : []);
    const total = data?.total || items.length;
    return { brands: Array.isArray(items) ? items : [], total: Number(total) || 0 };
  } catch (error) {
    console.error('Failed to fetch manufacturer brands:', error);
    return { brands: [], total: 0 };
  }
};
