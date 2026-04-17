import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

const dataFile = path.join(process.cwd(), 'data.json')

interface FamilyMember {
  id: string
  name: string
}

interface User {
  id: string
  name: string
  password: string // hashed
  familyMembers: FamilyMember[]
}

interface Log {
  id: string
  date: string
  type: string
  time: number
  quantity: 'small' | 'medium' | 'a lot'
  timestamp: string
  memberId: string
}

async function readData(): Promise<{ users: User[]; logs: Log[] }> {
  try {
    const data = await fs.readFile(dataFile, 'utf8')
    const parsed = JSON.parse(data)
    return {
      users: parsed.users || [],
      logs: parsed.logs || []
    }
  } catch {
    return { users: [], logs: [] }
  }
}

async function writeData(data: { users: User[]; logs: Log[] }): Promise<void> {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2))
}

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex')
    crypto.pbkdf2(password, salt, 100000, 64, 'sha256', (err, derivedKey) => {
      if (err) reject(err)
      resolve(salt + ':' + derivedKey.toString('hex'))
    })
  })
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':')
    crypto.pbkdf2(password, salt, 100000, 64, 'sha256', (err, derivedKey) => {
      if (err) reject(err)
      resolve(key === derivedKey.toString('hex'))
    })
  })
}

export async function getUsers(): Promise<User[]> {
  const data = await readData()
  return data.users
}

export async function addUser(name: string, password: string): Promise<User> {
  const data = await readData()
  const existing = data.users.find(u => u.name === name)
  if (existing) {
    throw new Error('User already exists')
  }
  const id = `user-${data.users.length + 1}`
  const hashedPassword = await hashPassword(password)
  const user: User = {
    id,
    name,
    password: hashedPassword,
    familyMembers: [{ id: `${id}-member-1`, name }]
  }
  data.users.push(user)
  await writeData(data)
  return user
}

export async function authenticate(name: string, password: string): Promise<User | null> {
  const data = await readData()
  const user = data.users.find(u => u.name === name)
  if (!user) return null
  const isValid = await verifyPassword(password, user.password)
  return isValid ? user : null
}

export async function getLogs(memberId?: string): Promise<Log[]> {
  const data = await readData()
  if (memberId !== undefined) {
    return data.logs.filter(log => log.memberId === memberId)
  }
  return data.logs
}

export async function upsertLog(
  date: string,
  type: string,
  time: number,
  quantity: 'small' | 'medium' | 'a lot',
  timestamp: string,
  memberId: string
): Promise<void> {
  const data = await readData()
  const existingIndex = data.logs.findIndex(log => log.date === date && log.memberId === memberId)
  if (existingIndex >= 0) {
    data.logs[existingIndex] = {
      ...data.logs[existingIndex],
      type,
      time,
      quantity,
      timestamp
    }
  } else {
    const id = `log-${data.logs.length + 1}`
    data.logs.push({ id, date, type, time, quantity, timestamp, memberId })
  }
  await writeData(data)
}

export async function deleteLog(date: string, memberId: string): Promise<void> {
  const data = await readData()
  data.logs = data.logs.filter(log => !(log.date === date && log.memberId === memberId))
  await writeData(data)
}

export async function addFamilyMember(userId: string, name: string): Promise<FamilyMember> {
  const data = await readData()
  const userIndex = data.users.findIndex(u => u.id === userId)
  if (userIndex === -1) throw new Error('User not found')
  const user = data.users[userIndex]
  const memberId = `${userId}-member-${user.familyMembers.length + 1}`
  const member: FamilyMember = { id: memberId, name }
  user.familyMembers.push(member)
  await writeData(data)
  return member
}

export async function removeFamilyMember(userId: string, memberId: string): Promise<void> {
  const data = await readData()
  const userIndex = data.users.findIndex(u => u.id === userId)
  if (userIndex === -1) throw new Error('User not found')
  const user = data.users[userIndex]
  if (user.familyMembers.length <= 1) throw new Error('Cannot remove the last family member')
  user.familyMembers = user.familyMembers.filter(m => m.id !== memberId)
  // Also remove logs for this member
  data.logs = data.logs.filter(log => log.memberId !== memberId)
  await writeData(data)
}