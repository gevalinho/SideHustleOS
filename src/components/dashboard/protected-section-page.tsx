import { DashboardSectionPage } from '@/components/dashboard/section-page'
import { requireAccountSession } from '@/lib/session'

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
  const accountSession = await requireAccountSession(returnTo)

  return <DashboardSectionPage section={section} user={accountSession.user} />
}
