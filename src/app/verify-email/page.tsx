import Link from 'next/link'

import { VerifyEmailForm } from '@/components/auth/auth-forms'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata = {
  title: 'Verify email | SideHustleOS',
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string
  }>
}) {
  const params = await searchParams

  return (
    <AuthShell
      title="Verify your email."
      subtitle="Confirm the email address attached to your account so account recovery and agent notifications work reliably."
      footer={
        <>
          Ready to continue?{' '}
          <Link href="/" className="font-semibold text-olive-950 dark:text-white">
            Go to dashboard
          </Link>
        </>
      }
    >
      <VerifyEmailForm token={params.token} />
    </AuthShell>
  )
}

