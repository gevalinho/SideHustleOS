import { DashboardSectionPage } from '@/components/dashboard/section-page'
import {
  getAgentsSectionData,
  getAnalyticsSectionData,
  getClientsSectionData,
  getDashboardMenuData,
  getEarningsSectionData,
  getHustlesSectionData,
  getOpportunitiesSectionData,
  getSettingsSectionData,
  getTasksSectionData,
} from '@/lib/dashboard-data'
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
  const sectionData =
    section === 'hustles'
      ? getHustlesSectionData(accountSession.user.id)
      : section === 'ai-agents'
        ? getAgentsSectionData(accountSession.user.id)
        : section === 'earnings'
          ? getEarningsSectionData(accountSession.user.id)
          : section === 'tasks'
            ? getTasksSectionData(accountSession.user.id)
            : section === 'opportunities'
              ? getOpportunitiesSectionData(accountSession.user.id)
              : section === 'settings'
                ? getSettingsSectionData(accountSession.user.id)
                : section === 'analytics'
                  ? getAnalyticsSectionData(accountSession.user.id)
                  : section === 'clients'
                    ? getClientsSectionData(accountSession.user.id)
                    : undefined

  return <DashboardSectionPage section={section} user={accountSession.user} sectionData={sectionData} menuData={getDashboardMenuData(accountSession.user.id)} />
}
