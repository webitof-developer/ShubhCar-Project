import { fetchWithAuth } from '@/lib/apiClient'
import { API_BASE_URL } from '@/helpers/apiBase'

export const inventoryAPI = {
  summary: async (token, params = {}) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/inventory/summary${query ? `?${query}` : ''}`
    return fetchWithAuth(url, { headers: { Authorization: `Bearer ${token}` } })
  },
  listProducts: async (token, params = {}) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/inventory/products${query ? `?${query}` : ''}`
    return fetchWithAuth(url, { headers: { Authorization: `Bearer ${token}` } })
  },
}
