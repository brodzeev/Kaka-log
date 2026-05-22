import { getAccessToken, refreshAccessToken, willTokenExpireSoon, isTokenExpired, clearSession } from './auth'

/**
 * Fetch wrapper that handles automatic token refresh
 * 
 * Usage:
 * const data = await fetchWithAuth('/api/logs', { method: 'GET' })
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options

  // Add authorization header if token exists
  let token = getAccessToken()
  
  if (token && !skipAuth) {
    // Check if token will expire soon and refresh preemptively
    if (willTokenExpireSoon(token)) {
      const newToken = await refreshAccessToken()
      if (newToken) {
        token = newToken
      } else {
        // Refresh failed, user will be logged out
        clearSession()
        throw new Error('Session expired. Please log in again.')
      }
    }

    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Authorization': `Bearer ${token}`
    }
  }

  // Make the request
  let response = await fetch(url, fetchOptions)

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401 && !skipAuth && token) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      // Retry the request with new token
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${newToken}`
      }
      response = await fetch(url, fetchOptions)
    } else {
      // Refresh failed, clear session
      clearSession()
    }
  }

  return response
}

/**
 * Fetch JSON with automatic token refresh
 * Returns parsed JSON response
 */
export async function fetchJsonWithAuth<T>(
  url: string,
  options?: RequestInit & { skipAuth?: boolean }
): Promise<T> {
  const response = await fetchWithAuth(url, options)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json() as Promise<T>
}
