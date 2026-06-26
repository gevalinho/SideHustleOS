import { DashboardHomePage } from '@/components/dashboard/home-page'
import { LandingPage } from '@/components/landing/landing-page'
import { getAccountSession } from '@/lib/session'

export default async function Page() {
  const accountSession = await getAccountSession()

  if (!accountSession) {
    return <LandingPage />
  }

  return <DashboardHomePage user={accountSession.user} />
}
