// API helper functions for dashboard analytics
import { fetchWithAuth } from '@/lib/apiClient'
import { API_BASE_URL } from '@/helpers/apiBase'

const extractResponseData = (payload) => {
  if (!payload || typeof payload !== 'object') return payload
  if (!Object.prototype.hasOwnProperty.call(payload, 'data')) return payload
  const rootData = payload.data
  if (rootData && typeof rootData === 'object' && Object.prototype.hasOwnProperty.call(rootData, 'data')) {
    return rootData.data
  }
  return rootData
}

export const dashboardAPI = {
  /**
   * Get main dashboard stats (Revenue, Orders, etc.)
   */
  getStats: async (token, params = {}) => {
    const query = new URLSearchParams(params).toString()
    const url = query ? `${API_BASE_URL}/analytics/dashboard?${query}` : `${API_BASE_URL}/analytics/dashboard`
    return fetchWithAuth(url, {
      headers: { Authorization: `Bearer ${token}` },
      extractData: extractResponseData,
    })
  },

  /**
   * Get sales/revenue chart data
   */
  getRevenueChart: async (token, params = {}) => {
    const query = new URLSearchParams(params).toString()
    const url = query ? `${API_BASE_URL}/analytics/dashboard/chart?${query}` : `${API_BASE_URL}/analytics/dashboard/chart`
    return fetchWithAuth(url, {
      headers: { Authorization: `Bearer ${token}` },
      extractData: extractResponseData,
    })
  },
}
