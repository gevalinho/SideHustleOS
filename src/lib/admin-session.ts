import { redirect } from 'next/navigation'

import { getAccountSession, safeRedirectPath } from '@/lib/session'

export async function requireAdminSession(returnTo = '/admin') {
  const accountSession = await getAccountSession()

  if (!accountSession) {
    redirect(`/login?returnTo=${encodeURIComponent(safeRedirectPath(returnTo))}`)
  }

  if (accountSession.user.role !== 'admin') {
    redirect('/')
  }

  return accountSession
}
