import { api } from '@/utils/apiClient';

export const submitContactForm = async (data) => {
  return await api.post('/entries', data);
};
