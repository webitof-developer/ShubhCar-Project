import { fetchWithAuth } from '@/lib/apiClient'
import { API_BASE_URL } from '@/helpers/apiBase'

export const activityLogsApi = {
  list: async (params = {}, token) => {
    const query = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value === undefined || value === null || value === '') return acc
        acc[key] = value
        return acc
      }, {}),
    ).toString()
    const url = `${API_BASE_URL}/user-activity-logs${query ? `?${query}` : ''}`
    return fetchWithAuth(url, { token })
  },
}

