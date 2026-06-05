import { NextRequest, NextResponse } from 'next/server'
import { addUser, addUserWithEmail, addChildUser, getUsers } from '../../../lib/db'
import { generateToken } from '../../../lib/tokens'

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
      
      // Generate JWT tokens for child
      const appAccessToken = generateToken(child, 'access')
      const refreshToken = generateToken(child, 'refresh')
      
      const response = NextResponse.json({ 
        success: true, 
        user: child, 
        isChild: true,
        accessToken: appAccessToken,
        expiresIn: 3600
      })
      
      // Set refresh token cookie
      response.cookies.set({
        name: 'refreshToken',
        value: refreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60
      })
      
      return response
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
      
      // Generate JWT tokens
      const appAccessToken = generateToken(user, 'access')
      const refreshToken = generateToken(user, 'refresh')
      
      const response = NextResponse.json({ 
        success: true, 
        user,
        accessToken: appAccessToken,
        expiresIn: 3600
      })
      
      response.cookies.set({
        name: 'refreshToken',
        value: refreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60
      })
      
      return response
    }
    
    // Username-based registration (legacy)
    const trimmedName = name?.trim()
    const trimmedPassword = password?.trim()
    if (!trimmedName || !trimmedPassword) {
      return NextResponse.json({ success: false, error: 'Name and password are required' }, { status: 400 })
    }

    const user = await addUser(trimmedName, trimmedPassword)
    
    // Generate JWT tokens
    const appAccessToken = generateToken(user, 'access')
    const refreshToken = generateToken(user, 'refresh')
    
    const response = NextResponse.json({ 
      success: true, 
      user,
      accessToken: appAccessToken,
      expiresIn: 3600
    })
    
    response.cookies.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60
    })
    
    return response
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}