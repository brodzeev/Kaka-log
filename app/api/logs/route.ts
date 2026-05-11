import { NextRequest, NextResponse } from 'next/server'
import { getLogs, getLogsForUser, insertLog, getUsers } from '../../../lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const memberId = searchParams.get('memberId')
  const userId = searchParams.get('userId')
  
  try {
    let logs
    
    // If userId is provided, use role-based filtering
    if (userId) {
      // Validate that userId exists
      const allUsers = await getUsers()
      const user = allUsers.find(u => u.id === userId)
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }
      
      // Get logs using role-based access control
      logs = await getLogsForUser(userId)
      
      // If a specific memberId was requested, filter to only that member
      // (This validates that the user has access to view that member's logs)
      if (memberId) {
        const memberIds = user.role === 'adult'
          ? user.familyMembers.map(m => m.id)
          : user.familyMembers.filter(m => m.role === 'child' || m.name === user.name).map(m => m.id)
        
        if (!memberIds.includes(memberId)) {
          return NextResponse.json(
            { success: false, error: 'Access denied: You cannot view this member\'s logs' },
            { status: 403 }
          )
        }
        
        logs = logs.filter(log => log.memberId === memberId)
      }
    } else if (memberId) {
      // Legacy support: if only memberId is provided, get logs for that member
      logs = await getLogs(memberId)
    } else {
      // Get all logs (backward compatibility)
      logs = await getLogs()
    }
    
    return NextResponse.json(logs)
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { date, type, time, quantity, timestamp, memberId } = await request.json()

  if (!date || !type || time === undefined || !memberId) {
    return NextResponse.json({ success: false, error: 'Date, type, time, and memberId are required' }, { status: 400 })
  }

  const logTimestamp = timestamp || new Date().toISOString()
  const logQuantity = quantity || 'medium'

  try {
    const newLog = await insertLog(date, type, time, logQuantity, logTimestamp, memberId)
    return NextResponse.json({ success: true, log: newLog })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const memberId = searchParams.get('memberId')

  if (!date || !memberId) {
    return NextResponse.json({ success: false, error: 'Date and memberId are required' }, { status: 400 })
  }

  // TODO: Use deleteLogById instead for better accuracy
  // await deleteLogById(logId)
  
  return NextResponse.json({ success: true })
}