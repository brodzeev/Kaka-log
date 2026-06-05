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
  role?: 'adult' | 'child'
  relationship?: string
  dateOfBirth?: string
}

export interface AuthMethod {
  type: 'username' | 'email' | 'google' | 'apple'
  linkedAt: string
  provider?: string
  providerId?: string
  identifier?: string
}

export interface User {
  _id?: string
  id: string
  name: string
  username?: string // Legacy login support
  email?: string // Modern login support
  password?: string // hashed (for username/email methods)
  role: 'adult' | 'child'
  familyId: string
  parentId?: string // if child, who is parent
  dateOfBirth?: string
  familyMembers: FamilyMember[]
  authMethods: AuthMethod[] // Track all auth methods linked to account
  googleId?: string
  appleId?: string
  theme?: 'light' | 'dark' | 'slate' | 'ocean' | 'forest' | 'sunset'
  createdAt?: string
  accountType?: 'legacy' | 'modern' | 'oauth'
}

export interface InviteCode {
  _id?: string
  code: string
  familyId: string
  createdBy: string
  createdAt: string
  expiresAt: string
  usedBy?: string
  usedAt?: string
  active: boolean
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

/**
 * Normalize old users that lack new fields (role, familyMembers, authMethods, familyId)
 * This ensures backwards compatibility with legacy user records
 */
export async function normalizeUser(user: any): Promise<User> {
  const { db } = await connectToDatabase()
  const usersCollection: Collection<User> = db.collection('users')
  
  // Check if user already has all required fields
  if (user.role && user.familyMembers && user.authMethods && user.familyId) {
    return user as User
  }
  
  // Build normalized user with defaults for missing fields
  const normalized: User = {
    ...user,
    id: user.id || user._id?.toString(),
    role: user.role || 'adult', // Assume old users are adults
    familyId: user.familyId || `family-${user.id}`, // Generate familyId if missing
    familyMembers: user.familyMembers || [{ id: `${user.id}-member-1`, name: user.name, role: 'adult' }],
    authMethods: user.authMethods || [{ type: 'username', linkedAt: user.createdAt || new Date().toISOString(), identifier: user.username || user.name }]
  }
  
  // Save normalized user back to database to prevent repeated normalization
  if (!user.role || !user.familyMembers || !user.authMethods || !user.familyId) {
    await usersCollection.updateOne(
      { id: user.id },
      { $set: { role: normalized.role, familyId: normalized.familyId, familyMembers: normalized.familyMembers, authMethods: normalized.authMethods } }
    )
  }
  
  return normalized
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
  const familyId = `family-${users.length + 1}`
  
  const user: User = {
    id,
    name,
    password: hashedPassword,
    role: 'adult',
    familyId,
    familyMembers: [{ id: `${id}-member-1`, name, role: 'adult' }],
    authMethods: [{ type: 'username', linkedAt: new Date().toISOString(), identifier: name }],
    createdAt: new Date().toISOString(),
    accountType: 'legacy'
  }
  
  await collection.insertOne(user as any)
  return { ...user, password: undefined }
}

export async function addUserWithEmail(name: string, email: string, password: string): Promise<User> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  const existing = await collection.findOne({ email })
  if (existing) {
    throw new Error('Email already exists')
  }
  
  const users = await collection.find({}).toArray()
  const id = `user-${users.length + 1}`
  const hashedPassword = await hashPassword(password)
  const familyId = `family-${users.length + 1}`
  
  const user: User = {
    id,
    name,
    email,
    password: hashedPassword,
    role: 'adult',
    familyId,
    familyMembers: [{ id: `${id}-member-1`, name, role: 'adult' }],
    authMethods: [{ type: 'email', linkedAt: new Date().toISOString(), identifier: email }],
    createdAt: new Date().toISOString(),
    accountType: 'modern'
  }
  
  await collection.insertOne(user as any)
  return { ...user, password: undefined }
}

export async function addUserWithOAuth(name: string, email: string | undefined, oauthType: 'google' | 'apple', providerId: string): Promise<User> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  const users = await collection.find({}).toArray()
  const id = `user-${users.length + 1}`
  const familyId = `family-${users.length + 1}`
  
  const authMethodType = oauthType === 'google' ? 'google' : 'apple'
  const user: User = {
    id,
    name,
    email,
    role: 'adult',
    familyId,
    familyMembers: [{ id: `${id}-member-1`, name, role: 'adult' }],
    authMethods: [{ type: authMethodType, linkedAt: new Date().toISOString(), provider: oauthType, providerId, identifier: email }],
    createdAt: new Date().toISOString(),
    accountType: 'oauth'
  }
  
  if (oauthType === 'google') {
    user.googleId = providerId
  } else {
    user.appleId = providerId
  }
  
  await collection.insertOne(user as any)
  return { ...user, password: undefined }
}

export async function authenticate(name: string, password: string): Promise<User | null> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  // Support both old 'name' field and new 'username' field for backward compatibility
  const user = await collection.findOne({ $or: [{ name }, { username: name }] })
  if (!user || !user.password) return null
  
  const isValid = await verifyPassword(password, user.password)
  if (!isValid) return null
  
  const normalized = await normalizeUser(user)
  return { ...normalized, password: undefined, _id: undefined }
}

export async function authenticateWithEmail(email: string, password: string): Promise<User | null> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  const user = await collection.findOne({ email })
  if (!user || !user.password) return null
  
  const isValid = await verifyPassword(password, user.password)
  if (!isValid) return null
  
  const normalized = await normalizeUser(user)
  return { ...normalized, password: undefined, _id: undefined }
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

export async function getLogsForUser(userId: string): Promise<Log[]> {
  const { db } = await connectToDatabase()
  const usersCollection: Collection<User> = db.collection('users')
  const logsCollection: Collection<Log> = db.collection('logs')
  
  const user = await usersCollection.findOne({ id: userId })
  if (!user) {
    return []
  }
  
  const normalized = await normalizeUser(user)
  
  // Get IDs of all family members this user can access
  const accessibleMemberIds: string[] = []
  
  if (normalized.role === 'adult') {
    // Adults can see their own logs and all family members' logs
    accessibleMemberIds.push(...(normalized.familyMembers || []).map(m => m.id))
  } else {
    // Children can only see their own logs
    // Find their own member ID (usually the first one with the user's name)
    const ownMember = (normalized.familyMembers || []).find(m => m.role === 'child' || m.name === normalized.name)
    if (ownMember) {
      accessibleMemberIds.push(ownMember.id)
    }
  }
  
  // Get all logs for accessible members
  const logs = await logsCollection.find({ memberId: { $in: accessibleMemberIds } }).toArray()
  return logs.map(({ _id, ...log }) => log)
}

export async function insertLog(
  date: string,
  type: string,
  time: number,
  quantity: 'small' | 'medium' | 'a lot',
  timestamp: string,
  memberId: string
): Promise<Log> {
  const { db } = await connectToDatabase()
  const collection: Collection<Log> = db.collection('logs')
  
  const logs = await collection.find({}).toArray()
  const id = `log-${logs.length + 1}`
  const newLog: Log = { id, date, type, time, quantity, timestamp, memberId }
  await collection.insertOne(newLog as any)
  return newLog
}

export async function upsertLog(
  date: string,
  type: string,
  time: number,
  quantity: 'small' | 'medium' | 'a lot',
  timestamp: string,
  memberId: string
): Promise<void> {
  // Deprecated: Use insertLog for new logs. This function is kept for backwards compatibility.
  await insertLog(date, type, time, quantity, timestamp, memberId)
}

export async function deleteLog(date: string, memberId: string): Promise<void> {
  // Deprecated: Use deleteLogById instead. This function is kept for backwards compatibility.
  const { db } = await connectToDatabase()
  const collection: Collection<Log> = db.collection('logs')
  await collection.deleteOne({ date, memberId })
}

export async function deleteLogById(logId: string): Promise<void> {
  const { db } = await connectToDatabase()
  const collection: Collection<Log> = db.collection('logs')
  await collection.deleteOne({ id: logId })
}

export async function addFamilyMember(userId: string, name: string, role: 'adult' | 'child' = 'child'): Promise<FamilyMember> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  let user = await collection.findOne({ id: userId })
  if (!user) throw new Error('User not found')
  
  const normalized = await normalizeUser(user)
  
  const memberId = `${userId}-member-${(normalized.familyMembers || []).length + 1}`
  const member: FamilyMember = { id: memberId, name, role }
  
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
  
  let user = await usersCollection.findOne({ id: userId })
  if (!user) throw new Error('User not found')
  
  const normalized = await normalizeUser(user)
  
  if ((normalized.familyMembers || []).length <= 1) throw new Error('Cannot remove the last family member')
  
  await usersCollection.updateOne(
    { id: userId },
    { $pull: { familyMembers: { id: memberId } } }
  )
  
  // Also remove logs for this member
  await logsCollection.deleteMany({ memberId })
}

export async function updateFamilyMember(userId: string, memberId: string, updates: Partial<FamilyMember>): Promise<FamilyMember> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  let user = await collection.findOne({ id: userId })
  if (!user) throw new Error('User not found')
  
  const normalized = await normalizeUser(user)
  
  // Find the member to update
  const memberIndex = (normalized.familyMembers || []).findIndex(m => m.id === memberId)
  if (memberIndex === -1) throw new Error('Family member not found')
  
  // Update the member
  const updatedMember: FamilyMember = {
    ...normalized.familyMembers![memberIndex],
    ...updates,
    id: memberId // Ensure ID doesn't change
  }
  
  // Update in database
  await collection.updateOne(
    { id: userId, 'familyMembers.id': memberId },
    { $set: { 'familyMembers.$': updatedMember } }
  )
  
  return updatedMember
}

export async function updateUserTheme(userId: string, theme: 'light' | 'dark' | 'slate' | 'ocean' | 'forest' | 'sunset'): Promise<void> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  await collection.updateOne(
    { id: userId },
    { $set: { theme } }
  )
}

// OAuth Functions
export async function getUserByGoogleId(googleId: string): Promise<User | null> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  const user = await collection.findOne({ googleId })
  return user ? { ...user, password: undefined, _id: undefined } : null
}

export async function getUserByAppleId(appleId: string): Promise<User | null> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  const user = await collection.findOne({ appleId })
  return user ? { ...user, password: undefined, _id: undefined } : null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  const user = await collection.findOne({ email })
  return user ? { ...user, password: undefined, _id: undefined } : null
}

export async function linkOAuthToUser(userId: string, oauthType: 'google' | 'apple', providerId: string, email?: string): Promise<User> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  const user = await collection.findOne({ id: userId })
  if (!user) throw new Error('User not found')
  
  const authMethod: AuthMethod = {
    type: oauthType,
    linkedAt: new Date().toISOString(),
    provider: oauthType,
    providerId,
    identifier: email
  }
  
  const updateData: any = {
    $push: { authMethods: authMethod }
  }
  
  if (oauthType === 'google') {
    updateData.$set = { googleId: providerId }
  } else {
    updateData.$set = { appleId: providerId }
  }
  
  await collection.updateOne({ id: userId }, updateData)
  
  const updated = await collection.findOne({ id: userId })
  return { ...updated, password: undefined, _id: undefined } as User
}

export async function unlinkOAuthFromUser(userId: string, oauthType: 'google' | 'apple'): Promise<User> {
  const { db } = await connectToDatabase()
  const collection: Collection<User> = db.collection('users')
  
  const user = await collection.findOne({ id: userId })
  if (!user) throw new Error('User not found')
  
  // Check if user has other auth methods
  const otherMethods = (user.authMethods || []).filter(m => m.type !== oauthType)
  if (otherMethods.length === 0) {
    throw new Error('Cannot unlink the only authentication method')
  }
  
  const updateData: any = {
    $pull: { authMethods: { type: oauthType } }
  }
  
  if (oauthType === 'google') {
    updateData.$unset = { googleId: 1 }
  } else {
    updateData.$unset = { appleId: 1 }
  }
  
  await collection.updateOne({ id: userId }, updateData)
  
  const updated = await collection.findOne({ id: userId })
  return { ...updated, password: undefined, _id: undefined } as User
}

export async function addChildUser(parentId: string, inviteCode: string, name: string, password: string): Promise<User> {
  const { db } = await connectToDatabase()
  const usersCollection: Collection<User> = db.collection('users')
  const inviteCodesCollection: Collection<InviteCode> = db.collection('inviteCodes')
  
  // Validate invite code
  const codeRecord = await inviteCodesCollection.findOne({ code: inviteCode, active: true })
  if (!codeRecord) {
    throw new Error('Invalid or expired invite code')
  }
  
  const now = new Date()
  if (new Date(codeRecord.expiresAt) < now) {
    throw new Error('Invite code has expired')
  }
  
  // Get parent from invite code
  const actualParentId = codeRecord.createdBy
  const parentUser = await usersCollection.findOne({ id: actualParentId })
  if (!parentUser) {
    throw new Error('Parent not found')
  }
  
  const parent = await normalizeUser(parentUser)
  
  if (codeRecord.familyId !== parent.familyId) {
    throw new Error('Invite code does not belong to this family')
  }
  
  // Create child user
  const users = await usersCollection.find({}).toArray()
  const childId = `user-${users.length + 1}`
  const hashedPassword = await hashPassword(password)
  
  const childMemberId = `${childId}-member-1`
  const childUser: User = {
    id: childId,
    name,
    password: hashedPassword,
    role: 'child',
    familyId: parent.familyId,
    parentId: actualParentId,
    familyMembers: [{ id: childMemberId, name, role: 'child' }],
    authMethods: [{ type: 'username', linkedAt: new Date().toISOString(), identifier: name }],
    createdAt: new Date().toISOString(),
    accountType: 'legacy'
  }
  
  await usersCollection.insertOne(childUser as any)
  
  // Add child to parent's familyMembers array
  const childFamilyMember: FamilyMember = {
    id: childMemberId,
    name,
    role: 'child'
  }
  
  await usersCollection.updateOne(
    { id: actualParentId },
    { $push: { familyMembers: childFamilyMember } }
  )
  
  // Mark invite code as used
  await inviteCodesCollection.updateOne(
    { code: inviteCode },
    { $set: { usedBy: childId, usedAt: new Date().toISOString(), active: false } }
  )
  
  return { ...childUser, password: undefined }
}

// Invite Code Functions
export async function createInviteCode(familyId: string, createdBy: string): Promise<InviteCode> {
  const { db } = await connectToDatabase()
  const collection: Collection<InviteCode> = db.collection('inviteCodes')
  
  const code = crypto.randomBytes(8).toString('hex').toUpperCase()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
  
  const inviteCode: InviteCode = {
    code,
    familyId,
    createdBy,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    active: true
  }
  
  await collection.insertOne(inviteCode as any)
  return inviteCode
}

export async function getInviteCodesForFamily(familyId: string): Promise<InviteCode[]> {
  const { db } = await connectToDatabase()
  const collection: Collection<InviteCode> = db.collection('inviteCodes')
  
  const codes = await collection.find({ familyId }).toArray()
  return codes.map(({ _id, ...code }) => code)
}

export async function validateInviteCode(code: string): Promise<InviteCode | null> {
  const { db } = await connectToDatabase()
  const collection: Collection<InviteCode> = db.collection('inviteCodes')
  
  const inviteCode = await collection.findOne({ code, active: true })
  if (!inviteCode) return null
  
  const now = new Date()
  if (new Date(inviteCode.expiresAt) < now) {
    return null
  }
  
  return { ...inviteCode, _id: undefined } as InviteCode
}

export async function revokeInviteCode(code: string): Promise<void> {
  const { db } = await connectToDatabase()
  const collection: Collection<InviteCode> = db.collection('inviteCodes')
  
  await collection.updateOne({ code }, { $set: { active: false } })
}

export async function useInviteCode(code: string, usedBy: string): Promise<void> {
  const { db } = await connectToDatabase()
  const collection: Collection<InviteCode> = db.collection('inviteCodes')
  
  await collection.updateOne(
    { code },
    { $set: { usedBy, usedAt: new Date().toISOString(), active: false } }
  )
}