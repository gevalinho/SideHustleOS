import { NextResponse } from 'next/server'

import {
  getAgent,
  getAgentMetrics,
  getAgentPerformance,
  listAgentLogs,
  listAgents,
  listPendingApprovals,
  resolveApproval,
  updateAgentStatus,
} from '@/lib/agents-store'
import { getRequestAuth } from '@/lib/request-auth'

type RouteContext = {
  params: Promise<{
    path?: string[]
  }>
}

type JsonObject = Record<string, unknown>

function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init)
}

function accepted(data: unknown) {
  return ok(data, { status: 202 })
}

function error(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

async function readJson(request: Request): Promise<JsonObject> {
  try {
    return (await request.json()) as JsonObject
  } catch {
    return {}
  }
}

function requireAuth(request: Request) {
  const auth = getRequestAuth(request)

  if (!auth) {
    return { response: error(401, 'UNAUTHORIZED', 'A valid login session is required.') }
  }

  return { auth }
}

function list(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const url = new URL(request.url)
  const hustleId = url.searchParams.get('hustleId') ?? undefined

  return ok({
    items: listAgents(required.auth.user.id, hustleId),
  })
}

function metrics(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok(getAgentMetrics(required.auth.user.id))
}

function priority(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const pendingApprovals = listPendingApprovals(required.auth.user.id)
  const agents = listAgents(required.auth.user.id)
  const priorityAgent =
    agents.find((agent) => agent.approvalsPending > 0) ??
    agents.find((agent) => agent.status === 'idle') ??
    agents.find((agent) => agent.status === 'paused') ??
    agents[0] ??
    null

  return ok({
    agent: priorityAgent,
    pendingApproval: pendingApprovals[0] ?? null,
    recommendation: priorityAgent
      ? {
          action: priorityAgent.approvalsPending > 0 ? 'review_approval' : priorityAgent.status === 'running' ? 'inspect_logs' : 'resume_agent',
          title: priorityAgent.approvalsPending > 0 ? `Review ${priorityAgent.name}` : `Check ${priorityAgent.name}`,
          rationale:
            priorityAgent.approvalsPending > 0
              ? 'Human approval is required before the agent can continue high-impact outreach.'
              : 'Keeping the highest-value agent healthy protects the current pipeline.',
        }
      : null,
  })
}

function getById(request: Request, agentId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const agent = getAgent(required.auth.user.id, agentId)

  if (!agent) {
    return error(404, 'AGENT_NOT_FOUND', 'Agent was not found.')
  }

  return ok(agent)
}

function updateStatus(request: Request, agentId: string, status: 'running' | 'paused') {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const agent = updateAgentStatus(required.auth.user.id, agentId, status)

  if (!agent) {
    return error(404, 'AGENT_NOT_FOUND', 'Agent was not found.')
  }

  return accepted(agent)
}

function logs(request: Request, agentId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const url = new URL(request.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 50), 1), 100)
  const items = listAgentLogs(required.auth.user.id, agentId, limit)

  if (!items) {
    return error(404, 'AGENT_NOT_FOUND', 'Agent was not found.')
  }

  return ok({ items, limit })
}

function approvals(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok({
    items: listPendingApprovals(required.auth.user.id),
  })
}

async function approvalDecision(request: Request, approvalId: string, status: 'approved' | 'rejected') {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const approval = resolveApproval(required.auth.user.id, approvalId, {
    status,
    editedDraft: typeof body.editedDraft === 'string' ? body.editedDraft.trim() : undefined,
    reason: typeof body.reason === 'string' ? body.reason.trim() : undefined,
  })

  if (!approval) {
    return error(404, 'APPROVAL_NOT_FOUND', 'Pending approval was not found.')
  }

  return accepted(approval)
}

function aiNextAction(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const pendingApprovals = listPendingApprovals(required.auth.user.id)
  const agents = listAgents(required.auth.user.id)
  const agent = agents.find((item) => item.approvalsPending > 0) ?? agents.find((item) => item.status !== 'running') ?? agents[0] ?? null

  return ok(
    agent
      ? {
          agentId: agent.id,
          action: pendingApprovals.length ? 'review_pending_approval' : agent.status === 'running' ? 'review_recent_logs' : 'resume_agent',
          title: pendingApprovals.length ? `Approve ${agent.name} draft` : `Optimize ${agent.name}`,
          rationale: pendingApprovals.length
            ? 'A generated draft is waiting for human review before it can be sent.'
            : 'Agent performance can improve with a quick health check and fresh run.',
          pendingApproval: pendingApprovals[0] ?? null,
        }
      : null,
  )
}

function performance(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok({
    items: getAgentPerformance(required.auth.user.id),
  })
}

async function handle(request: Request, context: RouteContext) {
  const { path = [] } = await context.params

  if (request.method === 'GET' && path.length === 0) return list(request)
  if (request.method === 'GET' && path[0] === 'metrics') return metrics(request)
  if (request.method === 'GET' && path[0] === 'priority') return priority(request)
  if (request.method === 'GET' && path[0] === 'approvals' && path[1] === 'pending') return approvals(request)
  if (request.method === 'POST' && path[0] === 'approvals' && path[2] === 'approve') return approvalDecision(request, path[1], 'approved')
  if (request.method === 'POST' && path[0] === 'approvals' && path[2] === 'reject') return approvalDecision(request, path[1], 'rejected')
  if (request.method === 'GET' && path[0] === 'ai-next-action') return aiNextAction(request)
  if (request.method === 'GET' && path[0] === 'performance') return performance(request)

  const [agentId, child] = path

  if (!agentId) {
    return error(404, 'NOT_FOUND', `Agents endpoint ${request.method} /agents was not found.`)
  }

  if (request.method === 'GET' && path.length === 1) return getById(request, agentId)
  if (request.method === 'POST' && child === 'run') return updateStatus(request, agentId, 'running')
  if (request.method === 'POST' && child === 'pause') return updateStatus(request, agentId, 'paused')
  if (request.method === 'POST' && child === 'resume') return updateStatus(request, agentId, 'running')
  if (request.method === 'GET' && child === 'logs') return logs(request, agentId)

  return error(404, 'NOT_FOUND', `Agents endpoint ${request.method} /agents/${path.join('/')} was not found.`)
}

export const GET = handle
export const POST = handle
