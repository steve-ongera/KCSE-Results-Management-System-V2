/**
 * src/api/axios.js
 *
 * Configured Axios instance for all API calls.
 *
 * Features:
 *   - Base URL from VITE_API_BASE_URL env var
 *   - Automatic JWT Bearer token injection on every request
 *   - Transparent access-token refresh on 401 (queued so parallel calls don't
 *     each trigger a separate refresh)
 *   - Automatic redirect to /login when refresh token is also expired
 *   - Request/response logging in development
 *   - Standardised error shape thrown to callers
 */

import axios from 'axios'

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_URL   = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
const ACCESS_KEY  = 'kcse_access'
const REFRESH_KEY = 'kcse_refresh'

// ── Token helpers ─────────────────────────────────────────────────────────────

export const tokenStorage = {
  getAccess:    ()      => localStorage.getItem(ACCESS_KEY),
  getRefresh:   ()      => localStorage.getItem(REFRESH_KEY),
  setAccess:    (token) => localStorage.setItem(ACCESS_KEY,  token),
  setRefresh:   (token) => localStorage.setItem(REFRESH_KEY, token),
  setTokens:    ({ access, refresh }) => {
    localStorage.setItem(ACCESS_KEY,  access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  },
  clearTokens:  () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

// ── Axios instance ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,          // 30 s — bulk-upload endpoints can be slow
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
})


// ── Request interceptor — inject Bearer token ─────────────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccess()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Development request logging
    if (import.meta.env.DEV) {
      console.debug(
        `[API] ${config.method?.toUpperCase()} ${config.url}`,
        config.params || config.data || '',
      )
    }
    return config
  },
  (error) => Promise.reject(error),
)


// ── Token-refresh queue ───────────────────────────────────────────────────────
//
// If multiple requests fire simultaneously and all get 401s, we want only one
// refresh request to go out. The rest wait in `failedQueue` and resolve/reject
// once the single refresh finishes.

let isRefreshing  = false
let failedQueue   = []

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else       prom.resolve(token)
  })
  failedQueue = []
}


// ── Response interceptor — handle 401 & errors ───────────────────────────────

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config

    // ── 401 Unauthorized → attempt token refresh ──────────────────────────
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      tokenStorage.getRefresh()
    ) {
      // Avoid infinite loop if the refresh endpoint itself returns 401
      if (originalRequest.url?.includes('/auth/refresh/')) {
        tokenStorage.clearTokens()
        window.location.href = '/login'
        return Promise.reject(normaliseError(error))
      }

      if (isRefreshing) {
        // Queue this request until the in-flight refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh/`,
          { refresh: tokenStorage.getRefresh() },
        )
        const newAccess = data.access
        tokenStorage.setAccess(newAccess)
        if (data.refresh) tokenStorage.setRefresh(data.refresh)

        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`
        originalRequest.headers.Authorization     = `Bearer ${newAccess}`

        processQueue(null, newAccess)
        return api(originalRequest)

      } catch (refreshError) {
        processQueue(refreshError, null)
        tokenStorage.clearTokens()
        window.location.href = '/login'
        return Promise.reject(normaliseError(refreshError))

      } finally {
        isRefreshing = false
      }
    }

    // ── All other errors ──────────────────────────────────────────────────
    return Promise.reject(normaliseError(error))
  },
)


/**
 * Normalise Axios errors into a consistent shape so callers don't need to
 * dig into error.response.data themselves.
 *
 * Returned shape:
 * {
 *   message:    string          — human-readable summary
 *   status:     number | null   — HTTP status code
 *   errors:     object | null   — DRF field-level validation errors
 *   isNetwork:  boolean         — true when no response received
 * }
 */
function normaliseError(error) {
  if (!error.response) {
    const networkErr  = new Error(
      'Network error — please check your connection and try again.'
    )
    networkErr.isNetwork = true
    networkErr.status    = null
    networkErr.errors    = null
    return networkErr
  }

  const { status, data } = error.response

  // DRF returns errors as: { field: ["msg"] } or { detail: "msg" } or { non_field_errors: [...] }
  const message =
    data?.detail ||
    data?.non_field_errors?.[0] ||
    (typeof data === 'string' ? data : null) ||
    `Request failed with status ${status}`

  const apiErr     = new Error(message)
  apiErr.status    = status
  apiErr.errors    = typeof data === 'object' && !data.detail ? data : null
  apiErr.isNetwork = false
  return apiErr
}


export default api