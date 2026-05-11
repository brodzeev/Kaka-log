import { NextRequest, NextResponse } from 'next/server'
import { createInviteCode, getInviteCodesForFamily, revokeInviteCode, getUsers } from '../../../lib/db'

/**
 * GET /api/invite-codes - List active invite codes for logged-in adult
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

    // Get user to verify they're an adult and get their family ID
    const users = await getUsers()
    const user = users.find(u => u.id === userId)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'adult') {
      return NextResponse.json(
        { success: false, error: 'Only adults can view invite codes' },
        { status: 403 }
      )
    }

    const codes = await getInviteCodesForFamily(user.familyId)
    
    return NextResponse.json({ success: true, codes })
  } catch (error: any) {
    console.error('Error fetching invite codes:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/invite-codes - Generate new invite code
 * Body: { userId }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    // Get user to verify they're an adult
    const users = await getUsers()
    const user = users.find(u => u.id === userId)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'adult') {
      return NextResponse.json(
        { success: false, error: 'Only adults can generate invite codes' },
        { status: 403 }
      )
    }

    const inviteCode = await createInviteCode(user.familyId, userId)

    return NextResponse.json({ success: true, code: inviteCode })
  } catch (error: any) {
    console.error('Error creating invite code:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/invite-codes/:code - Revoke invite code
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const userId = searchParams.get('userId')

    if (!code || !userId) {
      return NextResponse.json(
        { success: false, error: 'code and userId are required' },
        { status: 400 }
      )
    }

    // Get user to verify they're an adult
    const users = await getUsers()
    const user = users.find(u => u.id === userId)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'adult') {
      return NextResponse.json(
        { success: false, error: 'Only adults can revoke invite codes' },
        { status: 403 }
      )
    }

    // Verify code belongs to user's family
    const codes = await getInviteCodesForFamily(user.familyId)
    const codeExists = codes.find(c => c.code === code)

    if (!codeExists) {
      return NextResponse.json(
        { success: false, error: 'Invite code not found' },
        { status: 404 }
      )
    }

    await revokeInviteCode(code)

    return NextResponse.json({ success: true, message: 'Invite code revoked' })
  } catch (error: any) {
    console.error('Error revoking invite code:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
