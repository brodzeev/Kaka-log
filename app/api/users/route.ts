import { NextRequest, NextResponse } from 'next/server'
import { addUser, getUsers } from '../../../lib/db'

export async function GET() {
  const users = await getUsers()
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json()

    const trimmedName = name?.trim()
    const trimmedPassword = password?.trim()
    if (!trimmedName || !trimmedPassword) {
      return NextResponse.json({ success: false, error: 'Name and password are required' }, { status: 400 })
    }

    const user = await addUser(trimmedName, trimmedPassword)
    return NextResponse.json({ success: true, user })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}