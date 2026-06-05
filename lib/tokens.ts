import crypto from 'crypto'
import { User } from './db'

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const ACCESS_TOKEN_EXPIRY = 1 * 60 * 60 // 1 hour in seconds
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 // 30 days in seconds

/**
 * JWT Token payload interface
 */
export interface TokenPayload {
  sub: string // user ID
  name: string
  email?: string
  role: 'adult' | 'child'
  familyId: string
  iat: number // issued at
  exp: number // expiration
  type: 'access' | 'refresh'
}

/**
 * Generate JWT token
 */
export function generateToken(user: User, type: 'access' | 'refresh' = 'access'): string {
  const now = Math.floor(Date.now() / 1000)
  const expiry = type === 'access' ? ACCESS_TOKEN_EXPIRY : REFRESH_TOKEN_EXPIRY
  
  const payload: TokenPayload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    familyId: user.familyId,
    iat: now,
    exp: now + expiry,
    type
  }
  
  return encodeJWT(payload)
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = decodeJWT(token)
    if (!payload) return null
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      return null // Token expired
    }
    
    return payload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Encode JWT (simplified - signs with HMAC)
 */
function encodeJWT(payload: TokenPayload): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }
  
  const headerEncoded = base64url(JSON.stringify(header))
  const payloadEncoded = base64url(JSON.stringify(payload))
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  return `${headerEncoded}.${payloadEncoded}.${signature}`
}

/**
 * Decode JWT (without verification - for reading)
 */
export function decodeJWT(token: string): TokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(base64urlDecode(parts[1])) as TokenPayload
    return payload
  } catch (error) {
    console.error('JWT decode failed:', error)
    return null
  }
}

/**
 * Base64URL encode (JWT format)
 */
function base64url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Base64URL decode (JWT format)
 */
function base64urlDecode(str: string): string {
  // Add padding if needed
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4)
  
  return Buffer.from(
    padded
      .replace(/-/g, '+')
      .replace(/_/g, '/'),
    'base64'
  ).toString('utf-8')
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token)
  if (!payload) return true
  
  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}

/**
 * Check if token will expire soon (within 5 minutes)
 */
export function willTokenExpireSoon(token: string): boolean {
  const payload = decodeJWT(token)
  if (!payload) return true
  
  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = payload.exp - now
  return timeUntilExpiry < 5 * 60 // Less than 5 minutes
}
