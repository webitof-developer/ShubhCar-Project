const getStoredToken = () => {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('authToken') || ''
}

const safeJson = async (response) => {
  try {
    return await response.json()
  } catch (error) {
    return null
  }
}

const buildHeaders = ({ headers, token, useStoredToken, body, skipContentType }) => {
  const resolvedToken = token || (useStoredToken ? getStoredToken() : '')
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const contentTypeHeader =
    skipContentType || isFormData ? {} : { 'Content-Type': 'application/json' }

  return {
    ...contentTypeHeader,
    ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
    ...headers,
  }
}

export const fetchWithAuth = async (url, options = {}) => {
  const {
    token,
    headers,
    parse = 'json',
    extractData,
    returnNullOnError = false,
    useStoredToken = false,
    skipContentType = false,
    ...fetchOptions
  } = options

  const response = await fetch(url, {
    ...fetchOptions,
    headers: buildHeaders({
      headers,
      token,
      useStoredToken,
      body: fetchOptions.body,
      skipContentType,
    }),
  })

  if (!response.ok) {
    if (returnNullOnError) return null
    const errorBody = await safeJson(response)
    const message = errorBody?.message || `API Error: ${response.statusText}`
    const error = new Error(message)
    error.status = response.status
    error.data = errorBody
    throw error
  }

  if (parse === 'blob') return response.blob()
  if (parse === 'text') return response.text()
  const payload = await safeJson(response)
  return extractData ? extractData(payload) : payload
}
