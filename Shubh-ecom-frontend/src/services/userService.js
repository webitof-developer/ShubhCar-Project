import { api } from '@/utils/apiClient'

export const getCurrentUser = async (accessToken) => {
  const data = await api.authGet('/users/me', accessToken)
  return data?.user || data || null
}

export const updateUserProfile = async (accessToken, profileData) => {
  const data = await api.authPut('/users/me', profileData, accessToken)
  return data?.user || data || null
}
