import APP_CONFIG from '@/config/app.config'

const baseUrl = APP_CONFIG.api.baseUrl

const fetchWithAuth = async (url, token, options = {}) => {
  if (!token) throw new Error('Missing access token')
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Request failed: ${response.statusText}`)
  }
  return response.json()
}

export const getCurrentUser = async (accessToken) => {
  const data = await fetchWithAuth(`${baseUrl}/users/me`, accessToken)
  return data?.data || data?.user || null
}

export const updateUserProfile = async (accessToken, profileData) => {
  const data = await fetchWithAuth(`${baseUrl}/users/me`, accessToken, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  })
  return data?.data || data?.user || null
}
