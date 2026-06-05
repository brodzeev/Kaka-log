import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, generateToken, decodeJWT } from '../../../../lib/tokens'
import { getUsers } from '../../../../lib/db'

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token not found' },
        { status: 401 }
      )
    }

    // Verify refresh token
    const payload = verifyToken(refreshToken)
    if (!payload || payload.type !== 'refresh') {
      return NextResponse.json(
        { success: false, error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Get updated user data from database
    const users = await getUsers()
    const user = users.find(u => u.id === payload.sub)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate new access token
    const newAccessToken = generateToken(user, 'access')

    // Optionally rotate refresh token
    const newRefreshToken = generateToken(user, 'refresh')

    const response = NextResponse.json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: 3600 // 1 hour in seconds
    })

    // Update refresh token cookie
    response.cookies.set({
      name: 'refreshToken',
      value: newRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })

    return response
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
