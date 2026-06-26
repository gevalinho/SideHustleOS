import Link from 'next/link'
import { redirect } from 'next/navigation'

import { RegisterForm } from '@/components/auth/auth-forms'
import { AuthShell } from '@/components/auth/auth-shell'
import { hasAccountSession, safeRedirectPath } from '@/lib/session'

export const metadata = {
  title: 'Create account | SideHustleOS',
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    returnTo?: string
  }>
}) {
  const params = await searchParams
  const returnTo = params.returnTo ? safeRedirectPath(params.returnTo) : '/onboarding'

  if (await hasAccountSession()) {
    redirect(returnTo)
  }

  return (
    <AuthShell
      title="Create your SideHustleOS account."
      subtitle="Start with a secure account, then let the system turn skills into offers, prospects, tasks, and revenue evidence."
      footer={
        <>
          Already have an account?{' '}
          <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="font-semibold text-olive-950 dark:text-white">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm returnTo={returnTo} />
    </AuthShell>
  )
}
