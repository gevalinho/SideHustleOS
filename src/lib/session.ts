import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { temporaryAccountSessionCookieName } from '@/lib/account-session'
import { authStore, getSessionByAccessToken, toPublicUser } from '@/lib/auth-store'

export async function hasAccountSession() {
  return Boolean(await getAccountSession())
}

export async function getAccountSession() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(temporaryAccountSessionCookieName)?.value

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

  return {
    session,
    user: toPublicUser(user),
  }
}

export function safeRedirectPath(path: unknown) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    return '/'
  }

  return path
}

export async function requireAccountSession(returnTo = '/') {
  const accountSession = await getAccountSession()

  if (!accountSession) {
    redirect(`/login?returnTo=${encodeURIComponent(safeRedirectPath(returnTo))}`)
  }

  return accountSession
}
