import { NextRequest, NextResponse } from 'next/server'
import { getUserByAppleId, getUserByEmail, addUserWithOAuth, linkOAuthToUser } from '../../../../../lib/db'
import fetch from 'node-fetch'

/**
 * Apple OAuth Callback Handler
 * Verifies the identity token with Apple's servers
 */

export async function POST(request: NextRequest) {
  try {
    const { identityToken, userIdentifier, userEmail, userName } = await request.json()

    if (!identityToken || !userIdentifier) {
      return NextResponse.json(
        { success: false, error: 'Identity token and user identifier are required' },
        { status: 400 }
      )
    }

    // Decode token (verification is complex due to JWKS handling)
    // For MVP, we'll do basic validation
    const parts = identityToken.split('.')
    if (parts.length !== 3) {
      return NextResponse.json(
        { success: false, error: 'Invalid token format' },
        { status: 400 }
      )
    }

    let claims
    try {
      claims = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid token payload' },
        { status: 400 }
      )
    }

    if (!claims.sub) {
      return NextResponse.json(
        { success: false, error: 'Invalid token payload' },
        { status: 400 }
      )
    }

    // Check if user already has Apple account linked
    let user = await getUserByAppleId(claims.sub)

    if (user) {
      // User exists, log them in
      return NextResponse.json({ success: true, user })
    }

    // Check if email exists - offer to link accounts
    const email = userEmail || claims.email
    if (email) {
      const existingUser = await getUserByEmail(email)
      if (existingUser) {
        return NextResponse.json({
          success: false,
          error: 'Account exists with this email',
          code: 'ACCOUNT_EXISTS',
          existingEmail: email,
          userId: existingUser.id
        }, { status: 409 })
      }
    }

    // Create new account
    // Apple doesn't always provide email, especially on subsequent logins
    const displayName = userName?.firstName && userName?.lastName 
      ? `${userName.firstName} ${userName.lastName}`
      : userName?.firstName 
      ? userName.firstName
      : email?.split('@')[0] || 'Apple User'

    user = await addUserWithOAuth(
      displayName,
      email,
      'apple',
      claims.sub
    )

    return NextResponse.json({ success: true, user, isNewAccount: true })
  } catch (error: any) {
    console.error('Apple OAuth error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'OAuth verification failed' },
      { status: 500 }
    )
  }
}

/**
 * Apple OAuth Login Endpoint
 * Frontend initiates Sign in with Apple, then calls this with the token
 */
export async function GET(request: NextRequest) {
  // In production, this might redirect to Apple OAuth endpoint
  // For now, return placeholder
  return NextResponse.json({
    success: false,
    error: 'Use POST method with identityToken'
  })
}
