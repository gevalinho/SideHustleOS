import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ForgotPasswordForm } from '@/components/auth/auth-forms'
import { AuthShell } from '@/components/auth/auth-shell'
import { hasAccountSession } from '@/lib/session'

export const metadata = {
  title: 'Reset password | SideHustleOS',
}

export default async function ForgotPasswordPage() {
  if (await hasAccountSession()) {
    redirect('/')
  }

  return (
    <AuthShell
      title="Reset your password."
      subtitle="Enter the email connected to your workspace. We will send reset instructions if the account exists."
      footer={
        <>
          Remembered it?{' '}
          <Link href="/login" className="font-semibold text-olive-950 dark:text-white">
            Sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}

