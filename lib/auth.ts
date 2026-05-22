/**
 * Authentication utility functions for session management
 */

type Theme = 'light' | 'dark' | 'slate' | 'ocean' | 'forest' | 'sunset'

export interface FamilyMember {
  id: string
  name: string
  role?: 'adult' | 'child'
}

export interface AuthSession {
  user: {
    id: string
    name: string
    email?: string
    role: 'adult' | 'child'
    familyMembers: FamilyMember[]
    theme?: Theme
    authMethods?: any[]
  }
  accessToken?: string
  expiresAt?: number
}

const SESSION_KEY = 'kaki_logger_session'
const ACCESS_TOKEN_KEY = 'kaki_logger_access_token'

/**
 * Save session to localStorage
 */
export function saveSession(session: AuthSession): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    if (session.accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken)
    }
  } catch (error) {
    console.error('Failed to save session:', error)
  }
}

/**
 * Load session from localStorage
 */
export function loadSession(): AuthSession | null {
  if (typeof window === 'undefined') return null
  try {
    const session = localStorage.getItem(SESSION_KEY)
    if (!session) return null
    
    const parsed = JSON.parse(session) as AuthSession
    
    // Check if session has expired
    if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
      clearSession()
      return null
    }
    
    return parsed
  } catch (error) {
    console.error('Failed to load session:', error)
    return null
  }
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch (error) {
    console.error('Failed to clear session:', error)
  }
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch (error) {
    console.error('Failed to get token:', error)
    return null
  }
}

/**
 * Update access token
 */
export function updateAccessToken(token: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
    const session = loadSession()
    if (session) {
      session.accessToken = token
      saveSession(session)
    }
  } catch (error) {
    console.error('Failed to update token:', error)
  }
}

/**
 * Decode JWT token (basic implementation - validate on server)
 */
export function decodeToken(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(atob(parts[1]))
    return payload
  } catch (error) {
    console.error('Failed to decode token:', error)
    return null
  }
}

/**
 * Refresh access token from server
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        clearSession()
      }
      return null
    }
    
    const result = await response.json()
    if (result.success && result.accessToken) {
      updateAccessToken(result.accessToken)
      return result.accessToken
    }
  } catch (error) {
    console.error('Token refresh failed:', error)
  }
  return null
}

/**
 * Check if token is expired based on payload
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload || !payload.exp) return true
  
  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}

/**
 * Check if token will expire soon (within 5 minutes)
 */
export function willTokenExpireSoon(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload || !payload.exp) return true
  
  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = payload.exp - now
  return timeUntilExpiry < 5 * 60 // Less than 5 minutes
}

/**
 * Get authorization header with token
 */
export function getAuthHeader(): Record<string, string> {
  const token = getAccessToken()
  if (token) {
    return { 'Authorization': `Bearer ${token}` }
  }
  return {}
}

/**
 * Handle Google OAuth response
 */
export async function handleGoogleOAuth(credentialResponse: any): Promise<AuthSession | null> {
  try {
    const response = await fetch('/api/auth/google/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: credentialResponse.credential })
    })
    
    const result = await response.json()
    if (result.success && result.user) {
      const expiresAt = result.expiresIn ? Date.now() + result.expiresIn * 1000 : Date.now() + 24 * 60 * 60 * 1000
      const session: AuthSession = {
        user: result.user,
        accessToken: result.accessToken,
        expiresAt
      }
      saveSession(session)
      return session
    }
  } catch (error) {
    console.error('Google OAuth error:', error)
  }
  return null
}

/**
 * Handle Apple OAuth response
 */
export async function handleAppleOAuth(userIdentifier: string, userEmail?: string): Promise<AuthSession | null> {
  try {
    const response = await fetch('/api/auth/apple/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userIdentifier,
        userEmail
      })
    })
    
    const result = await response.json()
    if (result.success && result.user) {
      const expiresAt = result.expiresIn ? Date.now() + result.expiresIn * 1000 : Date.now() + 24 * 60 * 60 * 1000
      const session: AuthSession = {
        user: result.user,
        accessToken: result.accessToken,
        expiresAt
      }
      saveSession(session)
      return session
    }
  } catch (error) {
    console.error('Apple OAuth error:', error)
  }
  return null
}
