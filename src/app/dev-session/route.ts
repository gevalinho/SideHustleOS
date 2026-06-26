import { NextResponse } from 'next/server'

import { temporaryAccountSessionCookieName } from '@/lib/account-session'

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url))

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
