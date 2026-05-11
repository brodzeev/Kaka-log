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
  }
  token?: string
  expiresAt?: number
}

const SESSION_KEY = 'kaki_logger_session'
const TOKEN_KEY = 'kaki_logger_token'

/**
 * Save session to localStorage
 */
export function saveSession(session: AuthSession): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    if (session.token) {
      localStorage.setItem(TOKEN_KEY, session.token)
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
    localStorage.removeItem(TOKEN_KEY)
  } catch (error) {
    console.error('Failed to clear session:', error)
  }
}

/**
 * Get stored token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch (error) {
    console.error('Failed to get token:', error)
    return null
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
      const session: AuthSession = {
        user: result.user,
        token: generateLocalToken(result.user),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
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
      const session: AuthSession = {
        user: result.user,
        token: generateLocalToken(result.user),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      }
      saveSession(session)
      return session
    }
  } catch (error) {
    console.error('Apple OAuth error:', error)
  }
  return null
}

/**
 * Generate a local JWT token (basic implementation)
 * In production, this should come from the server
 */
function generateLocalToken(user: any): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
  }))
  const signature = 'local' // This should be signed on server in production
  
  return `${header}.${payload}.${signature}`
}

/**
 * Check if session is still valid
 */
export function isSessionValid(): boolean {
  const session = loadSession()
  if (!session) return false
  if (session.expiresAt && session.expiresAt < Date.now()) {
    clearSession()
    return false
  }
  return true
}
