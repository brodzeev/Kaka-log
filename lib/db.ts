import { MongoClient, Db, Collection } from 'mongodb'
import crypto from 'crypto'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set')
}

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = new MongoClient(MONGODB_URI as string)
  await client.connect()
  const db = client.db('kakilogger')

  cachedClient = client
  cachedDb = db

  return { client, db }
}

export interface FamilyMember {
  id: string
  name: string
}

export interface User {
  _id?: string
  id: string
  name: string
  password: string // hashed
  familyMembers: FamilyMember[]
  theme?: 'light' | 'dark' | 'slate' | 'ocean' | 'forest' | 'sunset'
}

export interface Log {
  _id?: string
  id: string
  date: string
  type: string
  time: number
  quantity: 'small' | 'medium' | 'a lot'
  timestamp: string
  memberId: string
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
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  const users = await collection.find({}).toArray()
  return users.map(({ _id, ...user }) => user)
}

export async function addUser(name: string, password: string): Promise<User> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  const existing = await collection.findOne({ name })
  if (existing) {
    throw new Error('User already exists')
  }
  
  const users = await collection.find({}).toArray()
  const id = `user-${users.length + 1}`
  const hashedPassword = await hashPassword(password)
  
  const user: User = {
    id,
    name,
    password: hashedPassword,
    familyMembers: [{ id: `${id}-member-1`, name }]
  }
  
  await collection.insertOne(user as any)
  return user
}

export async function authenticate(name: string, password: string): Promise<User | null> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  const user = await collection.findOne({ name })
  if (!user) return null
  
  const isValid = await verifyPassword(password, user.password)
  return isValid ? { ...user, _id: undefined } : null
}

export async function getLogs(memberId?: string): Promise<Log[]> {
  const { db } = await connectToDatabase()
  const collection: Collection<Log> = db.collection('logs')
  
  if (memberId !== undefined) {
    const logs = await collection.find({ memberId }).toArray()
    return logs.map(({ _id, ...log }) => log)
  }
  
  const logs = await collection.find({}).toArray()
  return logs.map(({ _id, ...log }) => log)
}

export async function upsertLog(
  date: string,
  type: string,
  time: number,
  quantity: 'small' | 'medium' | 'a lot',
  timestamp: string,
  memberId: string
): Promise<void> {
  const { db } = await connectToDatabase()
  const collection: Collection<Log> = db.collection('logs')
  
  const existingLog = await collection.findOne({ date, memberId })
  
  if (existingLog) {
    await collection.updateOne(
      { date, memberId },
      {
        $set: {
          type,
          time,
          quantity,
          timestamp
        }
      }
    )
  } else {
    const logs = await collection.find({}).toArray()
    const id = `log-${logs.length + 1}`
    const newLog: Log = { id, date, type, time, quantity, timestamp, memberId }
    await collection.insertOne(newLog as any)
  }
}

export async function deleteLog(date: string, memberId: string): Promise<void> {
  const { db } = await connectToDatabase()
  const collection: Collection<Log> = db.collection('logs')
  await collection.deleteOne({ date, memberId })
}

export async function addFamilyMember(userId: string, name: string): Promise<FamilyMember> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  const user = await collection.findOne({ id: userId })
  if (!user) throw new Error('User not found')
  
  const memberId = `${userId}-member-${user.familyMembers.length + 1}`
  const member: FamilyMember = { id: memberId, name }
  
  await collection.updateOne(
    { id: userId },
    { $push: { familyMembers: member } }
  )
  
  return member
}

export async function removeFamilyMember(userId: string, memberId: string): Promise<void> {
  const { db } = await connectToDatabase()
  const usersCollection: Collection<User> = db.collection('users')
  const logsCollection: Collection<Log> = db.collection('logs')
  
  const user = await usersCollection.findOne({ id: userId })
  if (!user) throw new Error('User not found')
  
  if (user.familyMembers.length <= 1) throw new Error('Cannot remove the last family member')
  
  await usersCollection.updateOne(
    { id: userId },
    { $pull: { familyMembers: { id: memberId } } }
  )
  
  // Also remove logs for this member
  await logsCollection.deleteMany({ memberId })
}

export async function updateUserTheme(userId: string, theme: 'light' | 'dark' | 'slate' | 'ocean' | 'forest' | 'sunset'): Promise<void> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  await collection.updateOne(
    { id: userId },
    { $set: { theme } }
  )
}