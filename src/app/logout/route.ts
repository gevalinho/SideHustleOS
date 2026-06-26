import { NextResponse } from 'next/server'

import { accountSessionCookieNames, temporaryAccountSessionCookieName } from '@/lib/account-session'
import { authStore, getSessionByAccessToken } from '@/lib/auth-store'

function getCookieValue(request: Request, name: string) {
  const cookie = request.headers.get('cookie') ?? ''

  return cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

export function GET(request: Request) {
  const accessToken = getCookieValue(request, temporaryAccountSessionCookieName)
  const session = accessToken ? getSessionByAccessToken(accessToken) : null
  const response = NextResponse.redirect(new URL('/login', request.url))

  if (session) {
    authStore.sessions.delete(session.id)
  }

  for (const name of accountSessionCookieNames) {
    response.cookies.set({
      name,
      value: '',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  }

  return response
}
