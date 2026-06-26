import { AdminDashboardPage } from '@/components/admin/admin-dashboard-page'
import {
  adminStore,
  getPlatformStats,
  getSystemHealth,
  listAdminAgentLogs,
  listAdminUsers,
  listOpenDisputes,
  listRunningAgents,
} from '@/lib/admin-store'
import { requireAdminSession } from '@/lib/admin-session'

const pageSizes = {
  users: 10,
  runningAgents: 5,
  agentLogs: 5,
  disputes: 5,
  broadcasts: 4,
}

function pageNumber(value: string | undefined) {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? Math.max(Math.floor(parsed), 1) : 1
}

function paginateItems<T>(items: T[], page: number, limit: number) {
  const totalPages = Math.max(Math.ceil(items.length / limit), 1)
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const offset = (currentPage - 1) * limit

  return {
    items: items.slice(offset, offset + limit),
    pagination: {
      page: currentPage,
      limit,
      total: items.length,
      totalPages,
    },
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    usersPage?: string
    agentsPage?: string
    logsPage?: string
    disputesPage?: string
    broadcastsPage?: string
  }>
}) {
  const accountSession = await requireAdminSession('/admin')
  const params = await searchParams
  const runningAgents = listRunningAgents()
  const agentLogs = listAdminAgentLogs({ limit: 200 })
  const disputes = listOpenDisputes()
  const broadcasts = [...adminStore.broadcasts.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <AdminDashboardPage
      user={accountSession.user}
      query={params}
      data={{
        stats: getPlatformStats(),
        health: getSystemHealth(),
        users: listAdminUsers({ page: pageNumber(params.usersPage), limit: pageSizes.users }),
        runningAgents: paginateItems(runningAgents, pageNumber(params.agentsPage), pageSizes.runningAgents),
        agentLogs: paginateItems(agentLogs, pageNumber(params.logsPage), pageSizes.agentLogs),
        disputes: paginateItems(disputes, pageNumber(params.disputesPage), pageSizes.disputes),
        broadcasts: paginateItems(broadcasts, pageNumber(params.broadcastsPage), pageSizes.broadcasts),
      }}
    />
  )
}
