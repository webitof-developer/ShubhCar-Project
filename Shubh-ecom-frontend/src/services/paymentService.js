import { api } from '@/utils/apiClient';

export const getPaymentMethods = async () => {
  return await api.get('/payments/methods');
};

export const initiatePayment = async (accessToken, { orderId, gateway }) => {
  return await api.authPost('/payments/initiate', { orderId, gateway }, accessToken);
};

export const getPaymentStatus = async (accessToken, paymentId) => {
  return await api.authGet(`/payments/${paymentId}/status`, accessToken);
};

export const confirmPayment = async (accessToken, paymentId, transactionId = null) => {
  const body = transactionId ? { transactionId } : {};
  return await api.authPost(`/payments/${paymentId}/confirm`, body, accessToken);
};
