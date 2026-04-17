import { NextRequest, NextResponse } from 'next/server'
import { deleteLog, upsertLog } from '../../../lib/db'

export async function POST(request: NextRequest) {
  const { date, type, time, quantity, timestamp, memberId } = await request.json()

  if (!memberId) {
    return NextResponse.json({ success: false, error: 'memberId required' }, { status: 400 })
  }

  const logTimestamp = timestamp || new Date().toISOString()
  const logQuantity = quantity || 'medium'

  await upsertLog(date, type, time, logQuantity, logTimestamp, memberId)

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const memberId = searchParams.get('memberId')

  if (!date || !memberId) {
    return NextResponse.json({ success: false, error: 'Missing date or memberId' }, { status: 400 })
  }

  await deleteLog(date, memberId)

  return NextResponse.json({ success: true })
}