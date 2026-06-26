import { ProtectedDashboardSectionPage } from '@/components/dashboard/protected-section-page'

export default function Page() {
  return <ProtectedDashboardSectionPage section="integrations" returnTo="/integrations" />
}
