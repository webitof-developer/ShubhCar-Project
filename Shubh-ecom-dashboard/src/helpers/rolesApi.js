import { fetchWithAuth } from '@/lib/apiClient'
import { API_BASE_URL } from '@/helpers/apiBase'

export const rolesAPI = {
  list: async (token) => {
    const url = `${API_BASE_URL}/roles`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers })
  },

  get: async (id, token) => {
    const url = `${API_BASE_URL}/roles/${id}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers })
  },

  create: async (data, token) => {
    const url = `${API_BASE_URL}/roles`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { method: 'POST', headers, body: JSON.stringify(data) })
  },

  update: async (id, data, token) => {
    const url = `${API_BASE_URL}/roles/${id}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { method: 'PUT', headers, body: JSON.stringify(data) })
  },

  remove: async (id, token) => {
    const url = `${API_BASE_URL}/roles/${id}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { method: 'DELETE', headers })
  },
}
