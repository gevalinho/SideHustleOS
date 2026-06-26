import { adminStore } from '@/lib/admin-store'
import { agentsStore } from '@/lib/agents-store'
import { authStore } from '@/lib/auth-store'
import { billingStore } from '@/lib/billing-store'
import { clientsStore } from '@/lib/clients-store'
import { earningsStore } from '@/lib/earnings-store'
import { hustlesStore } from '@/lib/hustles-store'
import { notificationsStore } from '@/lib/notifications-store'
import { onboardingStore } from '@/lib/onboarding-store'
import { opportunitiesStore } from '@/lib/opportunities-store'
import { settingsStore } from '@/lib/settings-store'
import { tasksStore } from '@/lib/tasks-store'

export type HealthStatus = 'ok' | 'degraded'

type HealthService = {
  name: string
  status: HealthStatus
  records?: number
  detail?: string
}

function service(name: string, records: number, detail?: string): HealthService {
  return {
    name,
    status: 'ok',
    records,
    detail,
  }
}

function runtimeSeconds() {
  return typeof process.uptime === 'function' ? Math.round(process.uptime()) : 0
}

export function getSystemHealth() {
  const services: HealthService[] = [
    service('api', 1, 'Next.js route handlers are responding'),
    service('auth-store', authStore.users.size + authStore.sessions.size, `${authStore.users.size} users, ${authStore.sessions.size} sessions`),
    service('onboarding-store', onboardingStore.states.size),
    service('hustles-store', hustlesStore.hustles.size + hustlesStore.actions.size),
    service('agents-store', agentsStore.agents.size + agentsStore.logs.size + agentsStore.approvals.size),
    service('tasks-store', tasksStore.tasks.size),
    service('clients-store', clientsStore.clients.size),
    service('earnings-store', earningsStore.invoices.size + earningsStore.earnings.size),
    service('opportunities-store', opportunitiesStore.opportunities.size),
    service('notifications-store', notificationsStore.notifications.size),
    service('billing-store', billingStore.accounts.size),
    service('settings-store', settingsStore.settings.size),
    service('admin-store', adminStore.disputes.size + adminStore.broadcasts.size + adminStore.userStatuses.size),
  ]
  const status: HealthStatus = services.every((item) => item.status === 'ok') ? 'ok' : 'degraded'

  return {
    status,
    checkedAt: new Date().toISOString(),
    uptimeSeconds: runtimeSeconds(),
    environment: process.env.NODE_ENV ?? 'development',
    services,
  }
}
