// src/utils/apiClient.js
/**
 * Shared HTTP client for all frontend services.
 *
 * Eliminates the copy-pasted getJson() / fetchWithAuth() helpers
 * that existed independently in brandService, vehicleService,
 * reviewService, categoryService, cartService, orderService, etc.
 *
 * All methods:
 *  - Throw an ApiError (with .status and .data) on non-2xx responses
 *  - Parse JSON automatically
 *  - Use APP_CONFIG.api.baseUrl as the base
 *
 * Usage:
 *   import { api } from '@/utils/apiClient';
 *
 *   // Public (no token)
 *   const data = await api.get('/products?page=1');
 *   const data = await api.post('/contact', { name, email });
 *
 *   // Authenticated
 *   const data = await api.authGet('/orders/my', token);
 *   const data = await api.authPost('/orders/place', payload, token);
 *   const data = await api.authPatch('/cart/items/123', { quantity: 2 }, token);
 *   const data = await api.authDelete('/cart/items/123', token);
 */

import APP_CONFIG from '@/config/app.config';

const BASE_URL = APP_CONFIG.api.baseUrl;
const BASE_PATHNAME = (() => {
  try {
    return new URL(BASE_URL).pathname.replace(/\/$/, '');
  } catch {
    return '/api/v1';
  }
})();

function resolveRequestUrl(url) {
  if (typeof window === 'undefined') return url;
  if (!url?.startsWith('http')) return url;

  try {
    const parsed = new URL(url);
    if (parsed.origin === window.location.origin) return url;

    let relativePath = parsed.pathname;
    if (relativePath.startsWith(BASE_PATHNAME)) {
      relativePath = relativePath.slice(BASE_PATHNAME.length);
    }
    relativePath = relativePath.replace(/^\/+/, '');

    return `/api/proxy/${relativePath}${parsed.search}`;
  } catch {
    return url;
  }
}

// ── Error type ───────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name  = 'ApiError';
    this.status = status;
    this.data   = data;
  }
}

// ── Core fetch wrapper ───────────────────────────────────────────────────────
async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const requestUrl = resolveRequestUrl(url);

  let response;
  try {
    response = await fetch(requestUrl, options);
  } catch (networkError) {
    throw new ApiError('Network error: could not reach server', 0, { url: requestUrl, originalUrl: url });
  }

  // Try to parse JSON regardless of status (errors often have a body)
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => '');

  if (!response.ok) {
    const message =
      (typeof body === 'object' ? body?.message : body) ||
      `Request failed: ${response.status} ${response.statusText}`;
    throw new ApiError(message, response.status, typeof body === 'object' ? body : {});
  }

  // Return just the .data payload when present, else the full body
  return typeof body === 'object' && 'data' in body ? body.data : body;
}

// ── Helper: build auth headers ───────────────────────────────────────────────
function authHeaders(token, extra = {}) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────
export const api = {
  // Public (no auth)
  get:  (path, options = {})        => request(path, { ...options, method: 'GET'  }),
  post: (path, body, options = {})  => request(path, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: JSON.stringify(body),
  }),

  // Authenticated
  authGet: (path, token, options = {}) => request(path, {
    ...options,
    method: 'GET',
    headers: authHeaders(token, options.headers),
  }),

  authPost: (path, body, token, options = {}) => request(path, {
    ...options,
    method: 'POST',
    headers: authHeaders(token, options.headers),
    body: JSON.stringify(body),
  }),

  authPatch: (path, body, token, options = {}) => request(path, {
    ...options,
    method: 'PATCH',
    headers: authHeaders(token, options.headers),
    body: JSON.stringify(body),
  }),

  authPut: (path, body, token, options = {}) => request(path, {
    ...options,
    method: 'PUT',
    headers: authHeaders(token, options.headers),
    body: JSON.stringify(body),
  }),

  authDelete: (path, token, options = {}) => request(path, {
    ...options,
    method: 'DELETE',
    headers: authHeaders(token, options.headers),
  }),
};
