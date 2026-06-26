import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ResetPasswordForm } from '@/components/auth/auth-forms'
import { AuthShell } from '@/components/auth/auth-shell'
import { hasAccountSession } from '@/lib/session'

export const metadata = {
  title: 'Set new password | SideHustleOS',
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string
  }>
}) {
  if (await hasAccountSession()) {
    redirect('/')
  }

  const params = await searchParams

  return (
    <AuthShell
      title="Set a new password."
      subtitle="Use the reset token from your email and choose a new password for your SideHustleOS account."
      footer={
        <>
          Need a token?{' '}
          <Link href="/forgot-password" className="font-semibold text-olive-950 dark:text-white">
            Request a reset
          </Link>
        </>
      }
    >
      <ResetPasswordForm token={params.token} />
    </AuthShell>
  )
}

