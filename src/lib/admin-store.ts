import { randomUUID } from 'crypto'

import { agentsStore } from '@/lib/agents-store'
import { authStore, createSession, toPublicUser, updateUser } from '@/lib/auth-store'
import { getBillingStatus } from '@/lib/billing-store'
import { getClientMetrics } from '@/lib/clients-store'
import { getEarningsMetrics } from '@/lib/earnings-store'
import { getHustleMetrics } from '@/lib/hustles-store'
import { getOpportunityMetrics } from '@/lib/opportunities-store'
import type { PublicUser } from '@/lib/auth-store'

export type AdminUserStatus = 'active' | 'suspended' | 'banned'

export type AdminDispute = {
  id: string
  userId: string
  title: string
  status: 'open' | 'overridden'
  amount: number
  winner: 'client' | 'freelancer' | 'split' | null
  splitPercent: number | null
  adminReason: string | null
  createdAt: string
  updatedAt: string
}

export type AdminBroadcast = {
  id: string
  title: string
  body: string
  audience: 'all' | 'paid'
  deliveredCount: number
  createdAt: string
}

type AdminStore = {
  userStatuses: Map<string, { status: AdminUserStatus; reason: string; updatedAt: string }>
  disputes: Map<string, AdminDispute>
  broadcasts: Map<string, AdminBroadcast>
}

const globalForAdmin = globalThis as typeof globalThis & {
  sideHustleOsAdminStore?: AdminStore
}

export const adminStore =
  globalForAdmin.sideHustleOsAdminStore ??
  (globalForAdmin.sideHustleOsAdminStore = {
    userStatuses: new Map<string, { status: AdminUserStatus; reason: string; updatedAt: string }>(),
    disputes: new Map<string, AdminDispute>(),
    broadcasts: new Map<string, AdminBroadcast>(),
  })

function now() {
  return new Date().toISOString()
}

function publicUsers() {
  return [...authStore.users.values()].map((user) => ({
    ...toPublicUser(user),
    adminStatus: adminStore.userStatuses.get(user.id)?.status ?? 'active',
    statusReason: adminStore.userStatuses.get(user.id)?.reason ?? null,
  }))
}

export function getPlatformStats() {
  const users = publicUsers()
  const paidUsers = users.filter((user) => user.plan !== 'free')
  const userIds = users.map((user) => user.id)

  return {
    users: {
      total: users.length,
      paid: paidUsers.length,
      free: users.length - paidUsers.length,
      suspended: users.filter((user) => user.adminStatus === 'suspended').length,
      banned: users.filter((user) => user.adminStatus === 'banned').length,
    },
    revenue: {
      collected: userIds.reduce((total, userId) => total + getEarningsMetrics(userId).collected, 0),
      outstanding: userIds.reduce((total, userId) => total + getEarningsMetrics(userId).outstanding, 0),
    },
    operations: {
      activeHustles: userIds.reduce((total, userId) => total + getHustleMetrics(userId).active, 0),
      clients: userIds.reduce((total, userId) => total + getClientMetrics(userId).total, 0),
      opportunities: userIds.reduce((total, userId) => total + getOpportunityMetrics(userId).total, 0),
      runningAgents: [...agentsStore.agents.values()].filter((agent) => agent.status === 'running').length,
    },
  }
}

export function getSystemHealth() {
  return {
    status: 'ok',
    services: [
      { name: 'api', status: 'ok' },
      { name: 'auth-store', status: 'ok', records: authStore.users.size },
      { name: 'agents-store', status: 'ok', records: agentsStore.agents.size },
      { name: 'admin-store', status: 'ok', records: adminStore.disputes.size + adminStore.broadcasts.size },
    ],
    checkedAt: now(),
  }
}

export function listAdminUsers(input: { search?: string; plan?: string; page: number; limit: number }) {
  const search = input.search?.trim().toLowerCase()
  const users = publicUsers()
    .filter((user) => (search ? `${user.name} ${user.email}`.toLowerCase().includes(search) : true))
    .filter((user) => (input.plan ? user.plan === input.plan : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const totalPages = Math.max(Math.ceil(users.length / input.limit), 1)
  const page = Math.min(Math.max(input.page, 1), totalPages)
  const offset = (page - 1) * input.limit

  return {
    items: users.slice(offset, offset + input.limit),
    pagination: {
      page,
      limit: input.limit,
      total: users.length,
      totalPages,
    },
  }
}

export function getAdminUserDetails(userId: string) {
  const user = authStore.users.get(userId)

  if (!user) {
    return null
  }

  return {
    user: publicUsers().find((candidate) => candidate.id === userId),
    billing: getBillingStatus(userId),
    metrics: {
      hustles: getHustleMetrics(userId),
      earnings: getEarningsMetrics(userId),
      clients: getClientMetrics(userId),
      opportunities: getOpportunityMetrics(userId),
    },
  }
}

export function setAdminUserStatus(userId: string, input: { status: AdminUserStatus; reason: string }) {
  const user = authStore.users.get(userId)

  if (!user) {
    return null
  }

  if (user.role === 'admin' && input.status !== 'active') {
    return null
  }

  adminStore.userStatuses.set(userId, {
    status: input.status,
    reason: input.reason,
    updatedAt: now(),
  })

  return getAdminUserDetails(userId)
}

export function setUserPlan(userId: string, plan: PublicUser['plan']) {
  const user = authStore.users.get(userId)

  if (!user) {
    return null
  }

  updateUser(user, { plan })

  return getAdminUserDetails(userId)
}

export function impersonateUser(adminUserId: string, userId: string, request: Request) {
  const user = authStore.users.get(userId)

  if (!user) {
    return null
  }

  const session = createSession({
    userId,
    userAgent: `Admin impersonation by ${adminUserId}: ${request.headers.get('user-agent') ?? 'Postman'}`,
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1',
  })

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    sessionId: session.id,
    user: toPublicUser(user),
    impersonatedBy: adminUserId,
  }
}

export function listRunningAgents() {
  return [...agentsStore.agents.values()].filter((agent) => agent.status === 'running').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function listAdminAgentLogs(input: { agentType?: string; limit: number }) {
  const agents = [...agentsStore.agents.values()]
  const allowedAgentIds = new Set(agents.filter((agent) => (input.agentType ? agent.type === input.agentType : true)).map((agent) => agent.id))

  return [...agentsStore.logs.values()]
    .filter((log) => allowedAgentIds.has(log.agentId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, input.limit)
}

export function seedDisputes() {
  if (adminStore.disputes.size) {
    return
  }

  const user = [...authStore.users.values()].find((candidate) => candidate.role !== 'admin') ?? [...authStore.users.values()][0]

  if (!user) {
    return
  }

  const timestamp = now()
  const dispute: AdminDispute = {
    id: randomUUID(),
    userId: user.id,
    title: 'Client disputed milestone delivery',
    status: 'open',
    amount: 850,
    winner: null,
    splitPercent: null,
    adminReason: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  adminStore.disputes.set(dispute.id, dispute)
}

export function listOpenDisputes() {
  seedDisputes()

  return [...adminStore.disputes.values()].filter((dispute) => dispute.status === 'open').sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function overrideDispute(disputeId: string, input: { winner: AdminDispute['winner']; splitPercent?: number | null; adminReason: string }) {
  seedDisputes()

  const dispute = adminStore.disputes.get(disputeId)

  if (!dispute) {
    return null
  }

  const updated: AdminDispute = {
    ...dispute,
    status: 'overridden',
    winner: input.winner,
    splitPercent: input.winner === 'split' ? input.splitPercent ?? 50 : null,
    adminReason: input.adminReason,
    updatedAt: now(),
  }

  adminStore.disputes.set(updated.id, updated)

  return updated
}

export function createBroadcast(input: { title: string; body: string; audience: 'all' | 'paid' }) {
  const deliveredCount = publicUsers().filter((user) => (input.audience === 'paid' ? user.plan !== 'free' : true)).length
  const broadcast: AdminBroadcast = {
    id: randomUUID(),
    title: input.title,
    body: input.body,
    audience: input.audience,
    deliveredCount,
    createdAt: now(),
  }

  adminStore.broadcasts.set(broadcast.id, broadcast)

  return broadcast
}
