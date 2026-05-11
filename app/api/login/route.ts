import { authenticate, authenticateWithEmail } from '../../../lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { name, password, email } = await request.json()
    
    let user = null
    
    // Try email login first if email is provided
    if (email && password) {
      user = await authenticateWithEmail(email, password)
    }
    // Fall back to username login
    else if (name && password) {
      user = await authenticate(name, password)
    }
    
    if (user) {
      return NextResponse.json({ success: true, user })
    } else {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}