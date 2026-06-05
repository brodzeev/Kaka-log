import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { linkOAuthToUser, unlinkOAuthFromUser, getUserByGoogleId, getUserByAppleId, getUsers } from '../../../../lib/db'

/**
 * POST /api/auth/link-oauth - Link OAuth provider to existing account
 * Body: { userId, idToken or identityToken, oauthProvider }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, idToken, identityToken, oauthProvider, userIdentifier } = await request.json()

    if (!userId || !oauthProvider) {
      return NextResponse.json(
        { success: false, error: 'userId and oauthProvider are required' },
        { status: 400 }
      )
    }

    // Get user to verify they exist
    const users = await getUsers()
    const user = users.find(u => u.id === userId)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    let payload: any = null

    if (oauthProvider === 'google') {
      if (!idToken) {
        return NextResponse.json(
          { success: false, error: 'idToken is required for Google OAuth' },
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

      // Verify Google token
      const client = new OAuth2Client(clientId)
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId
      })

      payload = ticket.getPayload()

      if (!payload || !payload.sub) {
        return NextResponse.json(
          { success: false, error: 'Invalid Google token' },
          { status: 400 }
        )
      }

      // Check if Google ID is already linked to another account
      const existingUser = await getUserByGoogleId(payload.sub)
      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { success: false, error: 'This Google account is already linked to another user' },
          { status: 409 }
        )
      }
    } else if (oauthProvider === 'apple') {
      if (!identityToken || !userIdentifier) {
        return NextResponse.json(
          { success: false, error: 'identityToken and userIdentifier are required for Apple OAuth' },
          { status: 400 }
        )
      }

      // Decode Apple JWT
      const parts = identityToken.split('.')
      if (parts.length !== 3) {
        return NextResponse.json(
          { success: false, error: 'Invalid Apple token format' },
          { status: 400 }
        )
      }

      try {
        payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      } catch (e) {
        return NextResponse.json(
          { success: false, error: 'Invalid Apple token payload' },
          { status: 400 }
        )
      }

      if (!payload.sub) {
        return NextResponse.json(
          { success: false, error: 'Invalid Apple token' },
          { status: 400 }
        )
      }

      // Check if Apple ID is already linked to another account
      const existingUser = await getUserByAppleId(payload.sub)
      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { success: false, error: 'This Apple account is already linked to another user' },
          { status: 409 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported OAuth provider' },
        { status: 400 }
      )
    }

    // Link the OAuth account
    const updatedUser = await linkOAuthToUser(
      userId,
      oauthProvider,
      payload.sub,
      payload.email
    )

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: any) {
    console.error('Error linking OAuth:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to link OAuth account' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/unlink-oauth - Unlink OAuth provider from account
 * Body: { userId, oauthProvider }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const oauthProvider = searchParams.get('provider')

    if (!userId || !oauthProvider) {
      return NextResponse.json(
        { success: false, error: 'userId and provider are required' },
        { status: 400 }
      )
    }

    // Get user to verify they exist
    const users = await getUsers()
    const user = users.find(u => u.id === userId)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Unlink the OAuth account
    const updatedUser = await unlinkOAuthFromUser(userId, oauthProvider as 'google' | 'apple')

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: any) {
    console.error('Error unlinking OAuth:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to unlink OAuth account' },
      { status: 500 }
    )
  }
}
