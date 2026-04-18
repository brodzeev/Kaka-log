import { NextRequest, NextResponse } from 'next/server'
import { updateUserTheme } from '../../../../lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, theme } = await request.json()

    if (!userId || !theme) {
      return NextResponse.json({ success: false, error: 'userId and theme are required' }, { status: 400 })
    }

    const validThemes = ['light', 'dark', 'slate', 'ocean', 'forest', 'sunset']
    if (!validThemes.includes(theme)) {
      return NextResponse.json({ success: false, error: 'Invalid theme' }, { status: 400 })
    }

    await updateUserTheme(userId, theme)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
