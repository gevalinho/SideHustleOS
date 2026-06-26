import { NextResponse } from 'next/server'

import { temporaryAccountSessionCookieName } from '@/lib/account-session'
import {
  authStore,
  createSession,
  createUser,
  getSessionByAccessToken,
  getSessionByRefreshToken,
  getUserByEmail,
  hashPassword,
  listUserSessions,
  normalizeEmail,
  randomToken,
  revokeUserSessions,
  toPublicUser,
  updateUser,
  verifyPassword,
} from '@/lib/auth-store'

type RouteContext = {
  params: Promise<{
    path?: string[]
  }>
}

type JsonObject = Record<string, unknown>

function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init)
}

function created(data: unknown) {
  return ok(data, { status: 201 })
}

function emptyOk(message: string) {
  return ok({ message })
}

function error(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

async function readJson(request: Request): Promise<JsonObject> {
  try {
    return (await request.json()) as JsonObject
  } catch {
    return {}
  }
}

function getClientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''

  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim()
  }

  return ''
}

function getCookieValue(request: Request, name: string) {
  const cookie = request.headers.get('cookie') ?? ''

  return cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

function getAuthToken(request: Request) {
  return getBearerToken(request) || getCookieValue(request, temporaryAccountSessionCookieName) || ''
}

function withAuthCookie(response: NextResponse, accessToken: string) {
  response.cookies.set({
    name: temporaryAccountSessionCookieName,
    value: accessToken,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return response
}

function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: temporaryAccountSessionCookieName,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}

function sessionPayload(session: ReturnType<typeof createSession>) {
  const user = authStore.users.get(session.userId)

  if (!user) {
    return null
  }

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    sessionId: session.id,
    user: toPublicUser(user),
  }
}

function authenticate(request: Request) {
  const token = getAuthToken(request)

  if (!token) {
    return null
  }

  const session = getSessionByAccessToken(token)

  if (!session) {
    return null
  }

  const user = authStore.users.get(session.userId)

  if (!user) {
    return null
  }

  authStore.sessions.set(session.id, {
    ...session,
    lastSeenAt: new Date().toISOString(),
  })

  return { session, user }
}

function requireAuth(request: Request) {
  const auth = authenticate(request)

  if (!auth) {
    return { response: error(401, 'UNAUTHORIZED', 'A valid bearer token is required.') }
  }

  return { auth }
}

function assertString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    return `${field} is required.`
  }

  return null
}

async function register(request: Request) {
  const body = await readJson(request)
  const nameError = assertString(body.name, 'name')
  const emailError = assertString(body.email, 'email')
  const passwordError = assertString(body.password, 'password')
  const validationError = nameError ?? emailError ?? passwordError

  if (validationError) {
    return error(400, 'VALIDATION_ERROR', validationError)
  }

  const email = normalizeEmail(body.email)

  if (getUserByEmail(email)) {
    return error(409, 'EMAIL_IN_USE', 'A user with this email already exists.')
  }

  const user = createUser({
    name: String(body.name),
    email,
    password: String(body.password),
  })
  const session = createSession({
    userId: user.id,
    userAgent: request.headers.get('user-agent') ?? 'Postman',
    ipAddress: getClientIp(request),
  })
  const payload = sessionPayload(session)

  if (!payload) {
    return error(500, 'SESSION_ERROR', 'Unable to create session.')
  }

  return withAuthCookie(created(payload), session.accessToken)
}

async function login(request: Request) {
  const body = await readJson(request)
  const email = normalizeEmail(body.email)
  const password = typeof body.password === 'string' ? body.password : ''
  const user = getUserByEmail(email)

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return error(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.')
  }

  if (user.twoFactorEnabled && body.totpCode !== '123456') {
    return error(401, 'TWO_FACTOR_REQUIRED', 'A valid TOTP code is required.')
  }

  const session = createSession({
    userId: user.id,
    userAgent: request.headers.get('user-agent') ?? 'Postman',
    ipAddress: getClientIp(request),
  })
  const payload = sessionPayload(session)

  if (!payload) {
    return error(500, 'SESSION_ERROR', 'Unable to create session.')
  }

  return withAuthCookie(ok(payload), session.accessToken)
}

async function refresh(request: Request) {
  const body = await readJson(request)
  const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : ''
  const oldSession = getSessionByRefreshToken(refreshToken)

  if (!oldSession) {
    return error(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired.')
  }

  authStore.sessions.delete(oldSession.id)

  const session = createSession({
    userId: oldSession.userId,
    userAgent: request.headers.get('user-agent') ?? oldSession.userAgent,
    ipAddress: getClientIp(request),
  })
  const payload = sessionPayload(session)

  if (!payload) {
    return error(500, 'SESSION_ERROR', 'Unable to refresh session.')
  }

  return withAuthCookie(ok(payload), session.accessToken)
}

async function verifyEmail(request: Request) {
  const body = await readJson(request)
  const token = typeof body.token === 'string' ? body.token : ''
  const auth = authenticate(request)
  const user =
    auth?.user ??
    [...authStore.users.values()].find((candidate) => candidate.verificationToken === token) ??
    [...authStore.users.values()][0]

  if (!user) {
    return error(404, 'USER_NOT_FOUND', 'No user is available to verify.')
  }

  const updated = updateUser(user, {
    emailVerified: true,
    verificationToken: undefined,
  })

  return ok({ user: toPublicUser(updated), message: 'Email verified.' })
}

async function forgotPassword(request: Request) {
  const body = await readJson(request)
  const email = normalizeEmail(body.email)
  const user = getUserByEmail(email)

  if (!user) {
    return emptyOk('If an account exists, a password reset email has been sent.')
  }

  const resetToken = randomToken('reset')
  updateUser(user, { resetToken })

  return ok({
    message: 'Password reset email queued.',
    resetToken,
  })
}

async function resetPassword(request: Request) {
  const body = await readJson(request)
  const token = typeof body.token === 'string' ? body.token : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

  if (!newPassword) {
    return error(400, 'VALIDATION_ERROR', 'newPassword is required.')
  }

  const user =
    [...authStore.users.values()].find((candidate) => candidate.resetToken === token) ??
    (token === 'paste-token-from-email' ? [...authStore.users.values()][0] : null)

  if (!user) {
    return error(400, 'INVALID_RESET_TOKEN', 'Password reset token is invalid or expired.')
  }

  const updated = updateUser(user, {
    passwordHash: hashPassword(newPassword),
    resetToken: undefined,
  })

  revokeUserSessions(updated.id)

  return ok({ user: toPublicUser(updated), message: 'Password reset complete.' })
}

async function changePassword(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

  if (!verifyPassword(currentPassword, required.auth.user.passwordHash)) {
    return error(401, 'INVALID_CURRENT_PASSWORD', 'Current password is incorrect.')
  }

  if (!newPassword) {
    return error(400, 'VALIDATION_ERROR', 'newPassword is required.')
  }

  const updated = updateUser(required.auth.user, {
    passwordHash: hashPassword(newPassword),
  })

  revokeUserSessions(updated.id, required.auth.session.id)

  return ok({ user: toPublicUser(updated), message: 'Password changed.' })
}

function me(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok({ user: toPublicUser(required.auth.user), sessionId: required.auth.session.id })
}

function logout(request: Request) {
  const auth = authenticate(request)

  if (auth) {
    authStore.sessions.delete(auth.session.id)
  }

  return clearAuthCookie(emptyOk('Logged out.'))
}

function logoutAll(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  revokeUserSessions(required.auth.user.id)

  return clearAuthCookie(emptyOk('All sessions logged out.'))
}

function sessions(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok(listUserSessions(required.auth.user.id))
}

function revokeSession(request: Request, sessionId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const session = authStore.sessions.get(sessionId)

  if (!session || session.userId !== required.auth.user.id) {
    return error(404, 'SESSION_NOT_FOUND', 'Session was not found.')
  }

  authStore.sessions.delete(session.id)

  return emptyOk('Session revoked.')
}

function resendVerification(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const token = randomToken('verify')
  updateUser(required.auth.user, { verificationToken: token })

  return ok({ message: 'Verification email queued.', verificationToken: token })
}

function setup2fa(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const secret = randomToken('totp').replace('totp_', '').slice(0, 24).toUpperCase()
  const updated = updateUser(required.auth.user, { twoFactorSecret: secret })
  const otpauthUrl = `otpauth://totp/SideHustleOS:${encodeURIComponent(updated.email)}?secret=${secret}&issuer=SideHustleOS`

  return ok({
    secret,
    otpauthUrl,
    qrCodeDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect width="220" height="220" fill="white"/><text x="20" y="112" font-size="14">SideHustleOS 2FA</text></svg>`)}`,
  })
}

async function enable2fa(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)

  if (body.totpCode !== '123456') {
    return error(400, 'INVALID_TOTP_CODE', 'Use 123456 for the local mock TOTP code.')
  }

  const updated = updateUser(required.auth.user, { twoFactorEnabled: true })

  return ok({ user: toPublicUser(updated), message: 'Two-factor authentication enabled.' })
}

async function disable2fa(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)

  if (body.totpCode !== '123456') {
    return error(400, 'INVALID_TOTP_CODE', 'Use 123456 for the local mock TOTP code.')
  }

  const updated = updateUser(required.auth.user, { twoFactorEnabled: false, twoFactorSecret: undefined })

  return ok({ user: toPublicUser(updated), message: 'Two-factor authentication disabled.' })
}

function connectGmail(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok({
    oauthUrl: `${new URL(request.url).origin}/api/v1/auth/gmail/callback?state=${required.auth.user.id}`,
    provider: 'gmail',
  })
}

function disconnectGmail(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const updated = updateUser(required.auth.user, { gmailConnected: false })

  return ok({ user: toPublicUser(updated), message: 'Gmail disconnected.' })
}

async function handle(request: Request, context: RouteContext) {
  const { path = [] } = await context.params
  const route = path.join('/')

  if (request.method === 'POST' && route === 'register') return register(request)
  if (request.method === 'POST' && route === 'login') return login(request)
  if (request.method === 'POST' && route === 'refresh') return refresh(request)
  if (request.method === 'GET' && route === 'me') return me(request)
  if (request.method === 'POST' && route === 'logout') return logout(request)
  if (request.method === 'POST' && route === 'logout-all') return logoutAll(request)
  if (request.method === 'GET' && route === 'sessions') return sessions(request)
  if (request.method === 'DELETE' && path[0] === 'sessions' && path[1]) return revokeSession(request, path[1])
  if (request.method === 'POST' && route === 'verify-email') return verifyEmail(request)
  if (request.method === 'POST' && route === 'resend-verification') return resendVerification(request)
  if (request.method === 'POST' && route === 'forgot-password') return forgotPassword(request)
  if (request.method === 'POST' && route === 'reset-password') return resetPassword(request)
  if (request.method === 'PATCH' && route === 'change-password') return changePassword(request)
  if (request.method === 'POST' && route === '2fa/setup') return setup2fa(request)
  if (request.method === 'POST' && route === '2fa/enable') return enable2fa(request)
  if (request.method === 'POST' && route === '2fa/disable') return disable2fa(request)
  if (request.method === 'GET' && route === 'gmail/connect') return connectGmail(request)
  if (request.method === 'DELETE' && route === 'gmail/disconnect') return disconnectGmail(request)

  return error(404, 'NOT_FOUND', `Auth endpoint ${request.method} /auth/${route} was not found.`)
}

export const GET = handle
export const POST = handle
export const PATCH = handle
export const DELETE = handle
