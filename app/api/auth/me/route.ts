import { NextRequest, NextResponse } from 'next/server'
import { getUsers } from '../../../../lib/db'

/**
 * GET /api/auth/me - Get current logged-in user info
 * Query params: userId (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const users = await getUsers()
    const user = users.find(u => u.id === userId)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove sensitive fields
    const { password, ...safeUser } = user

    return NextResponse.json({ success: true, user: safeUser })
  } catch (error: any) {
    console.error('Error fetching current user:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
