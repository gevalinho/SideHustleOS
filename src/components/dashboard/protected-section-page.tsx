import { DashboardSectionPage } from '@/components/dashboard/section-page'
import { requireCompletedOnboarding } from '@/lib/session'

type SectionKey =
  | 'hustles'
  | 'ai-agents'
  | 'tasks'
  | 'clients'
  | 'earnings'
  | 'analytics'
  | 'opportunities'
  | 'integrations'
  | 'settings'

export async function ProtectedDashboardSectionPage({ section, returnTo }: { section: SectionKey; returnTo: string }) {
  const accountSession = await requireCompletedOnboarding(returnTo)

  return <DashboardSectionPage section={section} user={accountSession.user} />
}
