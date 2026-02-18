const LOCAL_API_BASE_URL = 'http://localhost:5000/api/v1'
const isProduction = process.env.NODE_ENV === 'production'
const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim()

const API_BASE_URL = configuredApiBaseUrl || (isProduction ? '' : LOCAL_API_BASE_URL)
const API_ORIGIN = API_BASE_URL ? API_BASE_URL.replace(/\/api\/v1\/?$/, '') : ''

export { API_BASE_URL, API_ORIGIN }
