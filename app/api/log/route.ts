import { NextRequest, NextResponse } from 'next/server'
import { deleteLogById, insertLog } from '../../../lib/db'

export async function POST(request: NextRequest) {
  const { date, type, time, quantity, timestamp, memberId } = await request.json()

  if (!memberId) {
    return NextResponse.json({ success: false, error: 'memberId required' }, { status: 400 })
  }

  const logTimestamp = timestamp || new Date().toISOString()
  const logQuantity = quantity || 'medium'

  const newLog = await insertLog(date, type, time, logQuantity, logTimestamp, memberId)

  return NextResponse.json({ success: true, log: newLog })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const logId = searchParams.get('logId')

  if (!logId) {
    return NextResponse.json({ success: false, error: 'Missing logId' }, { status: 400 })
  }

  await deleteLogById(logId)

  return NextResponse.json({ success: true })
}