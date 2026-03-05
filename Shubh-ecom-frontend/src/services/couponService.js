import { api } from '@/utils/apiClient';

const extractCoupons = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.coupons)) return payload.coupons;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const getPublicCoupons = async () => {
  const payload = await api.get('/coupons/public');
  return extractCoupons(payload);
};
