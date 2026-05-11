import { NextRequest, NextResponse } from 'next/server'
import { addUser, addUserWithEmail, addChildUser, getUsers } from '../../../lib/db'

export async function GET() {
  const users = await getUsers()
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  try {
    const { name, password, email, authMethod, inviteCode, parentId } = await request.json()

    // Child registration with invite code
    if (inviteCode) {
      if (!name || !password) {
        return NextResponse.json(
          { success: false, error: 'Name and password are required for child registration' },
          { status: 400 }
        )
      }

      const child = await addChildUser(parentId || '', inviteCode, name.trim(), password.trim())
      return NextResponse.json({ success: true, user: child, isChild: true })
    }

    // Email-based registration
    if (authMethod === 'email' && email && password) {
      const trimmedEmail = email?.trim()
      const trimmedName = name?.trim()
      const trimmedPassword = password?.trim()
      
      if (!trimmedEmail || !trimmedName || !trimmedPassword) {
        return NextResponse.json({ success: false, error: 'Name, email, and password are required' }, { status: 400 })
      }
      
      const user = await addUserWithEmail(trimmedName, trimmedEmail, trimmedPassword)
      return NextResponse.json({ success: true, user })
    }
    
    // Username-based registration (legacy)
    const trimmedName = name?.trim()
    const trimmedPassword = password?.trim()
    if (!trimmedName || !trimmedPassword) {
      return NextResponse.json({ success: false, error: 'Name and password are required' }, { status: 400 })
    }

    const user = await addUser(trimmedName, trimmedPassword)
    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}