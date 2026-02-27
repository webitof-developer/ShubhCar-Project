import { fetchWithAuth } from '@/lib/apiClient'
import { API_BASE_URL } from '@/helpers/apiBase'

export const salesReportsAPI = {
  summary: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/sales-reports/summary${query ? `?${query}` : ''}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers })
  },

  salesmanPerformance: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/sales-reports/salesman-performance${query ? `?${query}` : ''}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers })
  },
}
