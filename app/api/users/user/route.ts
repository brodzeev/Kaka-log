import { NextRequest, NextResponse } from 'next/server'
import { addUser } from '../../../../lib/db'

export async function POST(request: NextRequest) {
  const { name, type } = await request.json()

  if (!name || !type) {
    return NextResponse.json({ success: false, error: 'Name and type required' }, { status: 400 })
  }

  const user = await addUser(name, type)
  return NextResponse.json({ success: true, user })
}