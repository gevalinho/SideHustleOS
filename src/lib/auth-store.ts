import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto'

export type PublicUser = {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  plan: 'free' | 'starter' | 'pro' | 'revenue_share'
  emailVerified: boolean
  twoFactorEnabled: boolean
  gmailConnected: boolean
  createdAt: string
  updatedAt: string
}

type UserRecord = PublicUser & {
  passwordHash: string
  resetToken?: string
  verificationToken?: string
  twoFactorSecret?: string
}

export type SessionRecord = {
  id: string
  userId: string
  accessToken: string
  refreshToken: string
  userAgent: string
  ipAddress: string
  createdAt: string
  lastSeenAt: string
  expiresAt: string
}

type AuthStore = {
  users: Map<string, UserRecord>
  sessions: Map<string, SessionRecord>
}

const globalForAuth = globalThis as typeof globalThis & {
  sideHustleOsAuthStore?: AuthStore
}

export const authStore =
  globalForAuth.sideHustleOsAuthStore ??
  (globalForAuth.sideHustleOsAuthStore = {
    users: new Map<string, UserRecord>(),
    sessions: new Map<string, SessionRecord>(),
  })

export function normalizeEmail(email: unknown) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')

  return `${salt}:${hash}`
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(':')

  if (!salt || !storedHash) {
    return false
  }

  const hash = scryptSync(password, salt, 64)
  const stored = Buffer.from(storedHash, 'hex')

  return stored.length === hash.length && timingSafeEqual(stored, hash)
}

export function getUserByEmail(email: string) {
  for (const user of authStore.users.values()) {
    if (user.email === email) {
      return user
    }
  }

  return null
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    gmailConnected: user.gmailConnected,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export function createUser(input: { name: string; email: string; password: string; role?: PublicUser['role'] }) {
  const now = new Date().toISOString()
  const user: UserRecord = {
    id: randomUUID(),
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    role: input.role ?? 'user',
    plan: 'free',
    emailVerified: false,
    twoFactorEnabled: false,
    gmailConnected: false,
    passwordHash: hashPassword(input.password),
    verificationToken: randomToken('verify'),
    createdAt: now,
    updatedAt: now,
  }

  authStore.users.set(user.id, user)

  return user
}

export function updateUser(user: UserRecord, patch: Partial<UserRecord>) {
  const updated = {
    ...user,
    ...patch,
    updatedAt: new Date().toISOString(),
  }

  authStore.users.set(updated.id, updated)

  return updated
}

export function randomToken(prefix: string) {
  return `${prefix}_${randomBytes(24).toString('base64url')}`
}

export function createSession(input: { userId: string; userAgent: string; ipAddress: string }) {
  const now = new Date()
  const session: SessionRecord = {
    id: randomUUID(),
    userId: input.userId,
    accessToken: randomToken('access'),
    refreshToken: randomToken('refresh'),
    userAgent: input.userAgent || 'Unknown client',
    ipAddress: input.ipAddress || '127.0.0.1',
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  }

  authStore.sessions.set(session.id, session)

  return session
}

export function getSessionByAccessToken(accessToken: string) {
  for (const session of authStore.sessions.values()) {
    if (session.accessToken === accessToken) {
      return session
    }
  }

  return null
}

export function getSessionByRefreshToken(refreshToken: string) {
  for (const session of authStore.sessions.values()) {
    if (session.refreshToken === refreshToken) {
      return session
    }
  }

  return null
}

export function revokeUserSessions(userId: string, exceptSessionId?: string) {
  for (const session of authStore.sessions.values()) {
    if (session.userId === userId && session.id !== exceptSessionId) {
      authStore.sessions.delete(session.id)
    }
  }
}

export function listUserSessions(userId: string) {
  return [...authStore.sessions.values()]
    .filter((session) => session.userId === userId)
    .map((session) => ({
      id: session.id,
      userId: session.userId,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastSeenAt: session.lastSeenAt,
      expiresAt: session.expiresAt,
    }))
}
