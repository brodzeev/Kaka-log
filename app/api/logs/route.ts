import { NextRequest, NextResponse } from 'next/server'
import { getLogs, upsertLog, deleteLog } from '../../../lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const memberId = searchParams.get('memberId')
  const logs = await getLogs(memberId || undefined)
  return NextResponse.json(logs)
}

export async function POST(request: NextRequest) {
  const { date, type, time, memberId } = await request.json()

  if (!date || !type || time === undefined || !memberId) {
    return NextResponse.json({ success: false, error: 'Date, type, time, and memberId are required' }, { status: 400 })
  }

  await upsertLog(date, type, time, memberId)
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const memberId = searchParams.get('memberId')

  if (!date || !memberId) {
    return NextResponse.json({ success: false, error: 'Date and memberId are required' }, { status: 400 })
  }

  await deleteLog(date, memberId)
  return NextResponse.json({ success: true })
}