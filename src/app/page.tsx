import { DashboardHomePage } from '@/components/dashboard/home-page'
import { LandingPage } from '@/components/landing/landing-page'
import { getAccountSession, requireCompletedOnboarding } from '@/lib/session'

export default async function Page() {
  const accountSession = await getAccountSession()

  if (!accountSession) {
    return <LandingPage />
  }

  const completedAccountSession = await requireCompletedOnboarding('/')

  return <DashboardHomePage user={completedAccountSession.user} />
}
