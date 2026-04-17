import { NextRequest, NextResponse } from 'next/server'
import { addFamilyMember } from '../../../lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, name } = await request.json()

    const trimmedName = name?.trim()
    if (!userId || !trimmedName) {
      return NextResponse.json({ success: false, error: 'UserId and name are required' }, { status: 400 })
    }

    const member = await addFamilyMember(userId, trimmedName)
    return NextResponse.json({ success: true, member })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}