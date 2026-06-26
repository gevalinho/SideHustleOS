import { randomUUID } from 'crypto'

import { listHustles } from '@/lib/hustles-store'

export type AgentType = 'prospect_hunter' | 'outreach' | 'proposal_writer' | 'invoice_ops'

export type Agent = {
  id: string
  userId: string
  hustleId: string
  type: AgentType
  name: string
  status: 'running' | 'paused' | 'idle'
  lastRunAt: string | null
  nextRunAt: string
  runsToday: number
  successRate: number
  approvalsPending: number
  createdAt: string
  updatedAt: string
}

export type AgentLog = {
  id: string
  userId: string
  agentId: string
  level: 'info' | 'warning' | 'error'
  message: string
  evidence: string
  createdAt: string
}

export type AgentApproval = {
  id: string
  userId: string
  agentId: string
  hustleId: string
  type: 'outreach_draft' | 'proposal_draft'
  status: 'pending' | 'approved' | 'rejected'
  draft: string
  editedDraft: string | null
  reason: string | null
  createdAt: string
  resolvedAt: string | null
}

type AgentsStore = {
  agents: Map<string, Agent>
  logs: Map<string, AgentLog>
  approvals: Map<string, AgentApproval>
}

const globalForAgents = globalThis as typeof globalThis & {
  sideHustleOsAgentsStore?: AgentsStore
}

export const agentsStore =
  globalForAgents.sideHustleOsAgentsStore ??
  (globalForAgents.sideHustleOsAgentsStore = {
    agents: new Map<string, Agent>(),
    logs: new Map<string, AgentLog>(),
    approvals: new Map<string, AgentApproval>(),
  })

function now() {
  return new Date().toISOString()
}

function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

const agentTemplates: Array<{ type: AgentType; name: string }> = [
  { type: 'prospect_hunter', name: 'Prospect Hunter' },
  { type: 'outreach', name: 'Outreach Agent' },
  { type: 'proposal_writer', name: 'Proposal Writer' },
  { type: 'invoice_ops', name: 'Invoice Ops' },
]

export function seedAgentsForUser(userId: string) {
  const hustles = listHustles(userId)

  for (const hustle of hustles) {
    const existingForHustle = [...agentsStore.agents.values()].some((agent) => agent.userId === userId && agent.hustleId === hustle.id)

    if (existingForHustle) {
      continue
    }

    agentTemplates.forEach((template, index) => {
      const timestamp = now()
      const agent: Agent = {
        id: randomUUID(),
        userId,
        hustleId: hustle.id,
        type: template.type,
        name: `${template.name} - ${hustle.name}`,
        status: index === 3 ? 'idle' : 'running',
        lastRunAt: index === 0 ? minutesFromNow(-12) : index === 1 ? minutesFromNow(-35) : null,
        nextRunAt: minutesFromNow(30 + index * 45),
        runsToday: 6 - index,
        successRate: 0.82 - index * 0.06,
        approvalsPending: index === 1 ? 1 : 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      agentsStore.agents.set(agent.id, agent)

      createAgentLog(userId, agent.id, {
        message: `${template.name} initialized for ${hustle.name}`,
        evidence: `Seeded from hustle ${hustle.id}`,
      })

      if (template.type === 'outreach') {
        createAgentApproval(userId, agent.id, hustle.id, {
          type: 'outreach_draft',
          draft: `Hi {{firstName}}, I help teams like yours with ${hustle.description.toLowerCase()}. Worth a quick 15-minute call this week?`,
        })
      }
    })
  }
}

export function listAgents(userId: string, hustleId?: string) {
  seedAgentsForUser(userId)

  return [...agentsStore.agents.values()]
    .filter((agent) => agent.userId === userId)
    .filter((agent) => (hustleId ? agent.hustleId === hustleId : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getAgent(userId: string, agentId: string) {
  seedAgentsForUser(userId)

  const agent = agentsStore.agents.get(agentId)

  if (!agent || agent.userId !== userId) {
    return null
  }

  return agent
}

export function updateAgentStatus(userId: string, agentId: string, status: Agent['status']) {
  const agent = getAgent(userId, agentId)

  if (!agent) {
    return null
  }

  const updated: Agent = {
    ...agent,
    status,
    lastRunAt: status === 'running' ? now() : agent.lastRunAt,
    runsToday: status === 'running' ? agent.runsToday + 1 : agent.runsToday,
    updatedAt: now(),
  }

  agentsStore.agents.set(updated.id, updated)
  createAgentLog(userId, updated.id, {
    message: status === 'running' ? 'Agent run requested' : `Agent ${status}`,
    evidence: `Status changed to ${status}`,
  })

  return updated
}

export function listAgentLogs(userId: string, agentId: string, limit: number) {
  const agent = getAgent(userId, agentId)

  if (!agent) {
    return null
  }

  return [...agentsStore.logs.values()]
    .filter((log) => log.userId === userId && log.agentId === agentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export function listPendingApprovals(userId: string) {
  seedAgentsForUser(userId)

  return [...agentsStore.approvals.values()]
    .filter((approval) => approval.userId === userId && approval.status === 'pending')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function resolveApproval(userId: string, approvalId: string, input: { status: 'approved' | 'rejected'; editedDraft?: string; reason?: string }) {
  const approval = agentsStore.approvals.get(approvalId)

  if (!approval || approval.userId !== userId || approval.status !== 'pending') {
    return null
  }

  const updated: AgentApproval = {
    ...approval,
    status: input.status,
    editedDraft: input.editedDraft ?? null,
    reason: input.reason ?? null,
    resolvedAt: now(),
  }

  agentsStore.approvals.set(updated.id, updated)

  const agent = agentsStore.agents.get(updated.agentId)

  if (agent) {
    agentsStore.agents.set(agent.id, {
      ...agent,
      approvalsPending: Math.max(agent.approvalsPending - 1, 0),
      updatedAt: now(),
    })
    createAgentLog(userId, agent.id, {
      message: `Approval ${input.status}`,
      evidence: input.reason || updated.editedDraft || updated.draft,
    })
  }

  return updated
}

export function getAgentMetrics(userId: string) {
  const agents = listAgents(userId)

  return {
    total: agents.length,
    running: agents.filter((agent) => agent.status === 'running').length,
    paused: agents.filter((agent) => agent.status === 'paused').length,
    idle: agents.filter((agent) => agent.status === 'idle').length,
    runsToday: agents.reduce((total, agent) => total + agent.runsToday, 0),
    approvalsPending: listPendingApprovals(userId).length,
    averageSuccessRate: agents.length ? Number((agents.reduce((total, agent) => total + agent.successRate, 0) / agents.length).toFixed(2)) : 0,
  }
}

export function getAgentPerformance(userId: string) {
  const agents = listAgents(userId)

  return agents.map((agent, index) => ({
    agentId: agent.id,
    name: agent.name,
    runsToday: agent.runsToday,
    successRate: agent.successRate,
    approvalsPending: agent.approvalsPending,
    series: Array.from({ length: 7 }, (_, day) => ({
      day: day + 1,
      runs: Math.max(agent.runsToday - (6 - day), 0),
      successRate: Number(Math.min(agent.successRate + day * 0.01 + index * 0.005, 0.98).toFixed(2)),
    })),
  }))
}

function createAgentLog(userId: string, agentId: string, input: { message: string; evidence: string; level?: AgentLog['level'] }) {
  const log: AgentLog = {
    id: randomUUID(),
    userId,
    agentId,
    level: input.level ?? 'info',
    message: input.message,
    evidence: input.evidence,
    createdAt: now(),
  }

  agentsStore.logs.set(log.id, log)

  return log
}

function createAgentApproval(
  userId: string,
  agentId: string,
  hustleId: string,
  input: {
    type: AgentApproval['type']
    draft: string
  },
) {
  const approval: AgentApproval = {
    id: randomUUID(),
    userId,
    agentId,
    hustleId,
    type: input.type,
    status: 'pending',
    draft: input.draft,
    editedDraft: null,
    reason: null,
    createdAt: now(),
    resolvedAt: null,
  }

  agentsStore.approvals.set(approval.id, approval)

  return approval
}

