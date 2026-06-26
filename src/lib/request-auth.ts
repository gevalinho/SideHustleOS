import { temporaryAccountSessionCookieName } from '@/lib/account-session'
import { authStore, getSessionByAccessToken, toPublicUser } from '@/lib/auth-store'

function getCookieValue(request: Request, name: string) {
  const cookie = request.headers.get('cookie') ?? ''

  return cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

export function getRequestAuthToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''

  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim()
  }

  return getCookieValue(request, temporaryAccountSessionCookieName) || ''
}

export function getRequestAuth(request: Request) {
  const accessToken = getRequestAuthToken(request)

  if (!accessToken || accessToken === 'temporary-dashboard-session') {
    return null
  }

  const session = getSessionByAccessToken(accessToken)

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

  return {
    session,
    user,
    publicUser: toPublicUser(user),
  }
}

