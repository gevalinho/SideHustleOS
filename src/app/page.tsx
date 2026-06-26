import { DashboardHomePage } from '@/components/dashboard/home-page'
import { LandingPage } from '@/components/landing/landing-page'
import { getDashboardHomeData } from '@/lib/dashboard-data'
import { getAccountSession, requireCompletedOnboarding } from '@/lib/session'

export default async function Page() {
  const accountSession = await getAccountSession()

  if (!accountSession) {
    return <LandingPage />
  }

  const completedAccountSession = await requireCompletedOnboarding('/')
  const dashboardData = getDashboardHomeData(completedAccountSession.user.id, completedAccountSession.user.plan)

  return <DashboardHomePage user={completedAccountSession.user} data={dashboardData} />
}
