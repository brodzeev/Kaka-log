import { NextRequest, NextResponse } from 'next/server'
import { addFamilyMember, removeFamilyMember } from '../../../lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, name, role } = await request.json()

    const trimmedName = name?.trim()
    if (!userId || !trimmedName) {
      return NextResponse.json({ success: false, error: 'UserId and name are required' }, { status: 400 })
    }

    // Default role to 'child' if not specified
    const memberRole = role === 'adult' ? 'adult' : 'child'

    const member = await addFamilyMember(userId, trimmedName, memberRole)
    return NextResponse.json({ success: true, member })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, memberId } = await request.json()

    if (!userId || !memberId) {
      return NextResponse.json({ success: false, error: 'UserId and memberId are required' }, { status: 400 })
    }

    await removeFamilyMember(userId, memberId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}