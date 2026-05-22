import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { getUserByGoogleId, getUserByEmail, addUserWithOAuth, linkOAuthToUser } from '../../../../../lib/db'
import { generateToken } from '../../../../../lib/tokens'

/**
 * Google OAuth Callback Handler
 * Verifies the ID token with Google's servers and creates/logs in user
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken, accessToken } = await request.json()

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'ID token is required' },
        { status: 400 }
      )
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Google OAuth not configured' },
        { status: 500 }
      )
    }

    // Verify ID token with Google's public keys
    const client = new OAuth2Client(clientId)
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId
    })

    const payload = ticket.getPayload()

    if (!payload || !payload.sub || !payload.email) {
      return NextResponse.json(
        { success: false, error: 'Invalid token payload' },
        { status: 400 }
      )
    }

    // Check if user already has Google account linked
    let user = await getUserByGoogleId(payload.sub)

    if (user) {
      // User exists, log them in
      const appAccessToken = generateToken(user, 'access')
      const refreshToken = generateToken(user, 'refresh')
      
      const response = NextResponse.json({ 
        success: true, 
        user,
        accessToken: appAccessToken,
        expiresIn: 3600
      })
      
      response.cookies.set({
        name: 'refreshToken',
        value: refreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60
      })
      
      return response
    }

    // Check if user exists by email - offer to link accounts
    const existingUser = await getUserByEmail(payload.email)
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Account exists with this email',
        code: 'ACCOUNT_EXISTS',
        existingEmail: payload.email,
        userId: existingUser.id
      }, { status: 409 })
    }

    // Create new account
    user = await addUserWithOAuth(
      payload.name || 'Google User',
      payload.email,
      'google',
      payload.sub
    )

    const appAccessToken = generateToken(user, 'access')
    const refreshToken = generateToken(user, 'refresh')
    
    const response = NextResponse.json({ 
      success: true, 
      user, 
      isNewAccount: true,
      accessToken: appAccessToken,
      expiresIn: 3600
    })
    
    response.cookies.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60
    })

    return response
  } catch (error: any) {
    console.error('Google OAuth error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'OAuth verification failed' },
      { status: 500 }
    )
  }
}

/**
 * Google OAuth Login Endpoint
 * Frontend redirects user to Google OAuth, then calls this with the token
 */
export async function GET(request: NextRequest) {
  // In production, this would generate the Google OAuth consent URL
  // For now, return placeholder
  return NextResponse.json({
    success: false,
    error: 'Use POST method with idToken'
  })
}
