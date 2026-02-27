// API helper functions for analytics endpoints
import { fetchWithAuth } from '@/lib/apiClient'
import { API_BASE_URL } from '@/helpers/apiBase'

const extractResponseData = (payload) => {
  if (!payload || typeof payload !== 'object') return null
  if (!Object.prototype.hasOwnProperty.call(payload, 'data')) return null
  const envelopeData = payload.data
  if (
    envelopeData &&
    typeof envelopeData === 'object' &&
    Object.prototype.hasOwnProperty.call(envelopeData, 'data')
  ) {
    return envelopeData.data
  }
  return envelopeData
}

export const analyticsAPI = {
  revenueSummary: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/analytics/revenue?${query}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers, extractData: extractResponseData })
  },

  userSummary: async (token) => {
    const url = `${API_BASE_URL}/analytics/users`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers, extractData: extractResponseData })
  },

  topProducts: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/analytics/top-products?${query}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers, extractData: extractResponseData })
  },

  inventory: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/analytics/inventory?${query}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers, extractData: extractResponseData })
  },

  reviews: async (token) => {
    const url = `${API_BASE_URL}/analytics/reviews`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers, extractData: extractResponseData })
  },

  revenueChart: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/analytics/dashboard/chart?${query}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers, extractData: extractResponseData })
  },

  salesByState: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/analytics/sales-by-state?${query}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers, extractData: extractResponseData })
  },

  salesByCity: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/analytics/sales-by-city?${query}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers, extractData: extractResponseData })
  },

  repeatCustomers: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/analytics/repeat-customers?${query}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers, extractData: extractResponseData })
  },

  fulfillment: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/analytics/fulfillment?${query}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers, extractData: extractResponseData })
  },

  funnel: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/analytics/funnel?${query}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers, extractData: extractResponseData })
  },

  topCategories: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/analytics/top-categories?${query}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers, extractData: extractResponseData })
  },

  topBrands: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/analytics/top-brands?${query}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers, extractData: extractResponseData })
  },

  inventoryTurnover: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString()
    const url = `${API_BASE_URL}/analytics/inventory-turnover?${query}`
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetchWithAuth(url, { headers, extractData: extractResponseData })
  },
}
