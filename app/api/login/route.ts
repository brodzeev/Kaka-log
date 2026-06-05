import { authenticate, authenticateWithEmail } from '../../../lib/db'
import { generateToken } from '../../../lib/tokens'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { name, password, email } = await request.json()
    
    let user = null
    
    // Try email login first if email is provided
    if (email && password) {
      user = await authenticateWithEmail(email, password)
    }
    // Fall back to username login
    else if (name && password) {
      user = await authenticate(name, password)
    }
    
    if (user) {
      // Generate JWT tokens
      const accessToken = generateToken(user, 'access')
      const refreshToken = generateToken(user, 'refresh')
      
      // Set refresh token as HttpOnly cookie
      const response = NextResponse.json({ 
        success: true, 
        user,
        accessToken,
        expiresIn: 3600 // 1 hour in seconds
      })
      
      response.cookies.set({
        name: 'refreshToken',
        value: refreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      })
      
      return response
    } else {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}