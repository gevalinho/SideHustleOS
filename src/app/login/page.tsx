import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LoginForm } from '@/components/auth/auth-forms'
import { AuthShell } from '@/components/auth/auth-shell'
import { hasAccountSession, safeRedirectPath } from '@/lib/session'

export const metadata = {
  title: 'Sign in | SideHustleOS',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    returnTo?: string
  }>
}) {
  const params = await searchParams
  const returnTo = safeRedirectPath(params.returnTo)

  if (await hasAccountSession()) {
    redirect(returnTo)
  }

  return (
    <AuthShell
      title="Sign in to your business cockpit."
      subtitle="Pick up your active hustles, agent approvals, earnings, and next actions from one focused dashboard."
      footer={
        <>
          New here?{' '}
          <Link href={`/register?returnTo=${encodeURIComponent(returnTo)}`} className="font-semibold text-olive-950 dark:text-white">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm returnTo={returnTo} />
    </AuthShell>
  )
}

