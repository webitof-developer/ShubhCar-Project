import { api } from '@/utils/apiClient';

export const createDraft = async (accessToken, payload = {}) => {
  return await api.authPost('/checkout-drafts', payload || {}, accessToken);
};

export const getDraft = async (accessToken, draftId) => {
  return await api.authGet(`/checkout-drafts/${draftId}`, accessToken);
};

export const retryPayment = async (accessToken, draftId) => {
  return await api.authPost(`/checkout-drafts/${draftId}/retry-payment`, {}, accessToken);
};
