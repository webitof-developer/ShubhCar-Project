const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

const fetchWithAuth = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await fetch(url, { ...options, headers })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `API Error: ${response.statusText}`)
  }
  return response.json()
}

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
