import { NextRequest, NextResponse } from 'next/server'
import { addFamilyMember, removeFamilyMember, updateFamilyMember } from '../../../lib/db'

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

export async function PUT(request: NextRequest) {
  try {
    const { userId, memberId, name, role, relationship, dateOfBirth } = await request.json()

    if (!userId || !memberId) {
      return NextResponse.json(
        { success: false, error: 'UserId and memberId are required' },
        { status: 400 }
      )
    }

    // Build update object with provided fields
    const updates: any = {}
    if (name !== undefined) updates.name = name.trim()
    if (role !== undefined) updates.role = role === 'adult' ? 'adult' : 'child'
    if (relationship !== undefined) updates.relationship = relationship.trim()
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one field to update is required' },
        { status: 400 }
      )
    }

    const member = await updateFamilyMember(userId, memberId, updates)
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