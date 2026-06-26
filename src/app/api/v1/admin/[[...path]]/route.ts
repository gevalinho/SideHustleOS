import { NextResponse } from 'next/server'

import {
  createBroadcast,
  getAdminUserDetails,
  getPlatformStats,
  impersonateUser,
  listAdminAgentLogs,
  listAdminUsers,
  listOpenDisputes,
  listRunningAgents,
  overrideDispute,
  setAdminUserStatus,
  setUserPlan,
} from '@/lib/admin-store'
import { getRequestAuth } from '@/lib/request-auth'
import { getSystemHealth } from '@/lib/system-health'
import type { AdminDispute, AdminUserStatus } from '@/lib/admin-store'
import type { PublicUser } from '@/lib/auth-store'

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

function requireAdmin(request: Request) {
  const auth = getRequestAuth(request)

  if (!auth) {
    return { response: error(401, 'UNAUTHORIZED', 'A valid login session is required.') }
  }

  if (auth.user.role !== 'admin') {
    return { response: error(403, 'FORBIDDEN', 'Admin access is required.') }
  }

  return { auth }
}

function getPagination(request: Request) {
  const url = new URL(request.url)
  const page = Math.max(Number(url.searchParams.get('page') ?? 1), 1)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 50), 1), 100)

  return { page, limit }
}

function parseUserStatus(value: unknown): AdminUserStatus | null {
  return ['active', 'suspended', 'banned'].includes(String(value)) ? (value as AdminUserStatus) : null
}

function parsePlan(value: unknown): PublicUser['plan'] | null {
  return ['free', 'starter', 'pro', 'revenue_share'].includes(String(value)) ? (value as PublicUser['plan']) : null
}

function parseWinner(value: unknown): AdminDispute['winner'] {
  return ['client', 'freelancer', 'split'].includes(String(value)) ? (value as AdminDispute['winner']) : null
}

function stats(request: Request) {
  const required = requireAdmin(request)

  if ('response' in required) {
    return required.response
  }

  return ok(getPlatformStats())
}

function health(request: Request) {
  const required = requireAdmin(request)

  if ('response' in required) {
    return required.response
  }

  return ok(getSystemHealth())
}

function users(request: Request) {
  const required = requireAdmin(request)

  if ('response' in required) {
    return required.response
  }

  const url = new URL(request.url)
  const { page, limit } = getPagination(request)

  return ok(
    listAdminUsers({
      page,
      limit,
      search: url.searchParams.get('search') ?? undefined,
      plan: url.searchParams.get('plan') ?? undefined,
    }),
  )
}

function userDetails(request: Request, userId: string) {
  const required = requireAdmin(request)

  if ('response' in required) {
    return required.response
  }

  const details = getAdminUserDetails(userId)

  if (!details) {
    return error(404, 'USER_NOT_FOUND', 'User was not found.')
  }

  return ok(details)
}

async function userStatus(request: Request, userId: string) {
  const required = requireAdmin(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const status = parseUserStatus(body.status)
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

  if (!status) {
    return error(400, 'VALIDATION_ERROR', 'status must be active, suspended, or banned.')
  }

  if (!reason) {
    return error(400, 'VALIDATION_ERROR', 'reason is required.')
  }

  const details = setAdminUserStatus(userId, { status, reason })

  if (!details) {
    return error(404, 'USER_NOT_FOUND', 'User was not found.')
  }

  return ok(details)
}

async function userPlan(request: Request, userId: string) {
  const required = requireAdmin(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const plan = parsePlan(body.plan)

  if (!plan) {
    return error(400, 'VALIDATION_ERROR', 'plan is invalid.')
  }

  const details = setUserPlan(userId, plan)

  if (!details) {
    return error(404, 'USER_NOT_FOUND', 'User was not found.')
  }

  return ok(details)
}

function impersonate(request: Request, userId: string) {
  const required = requireAdmin(request)

  if ('response' in required) {
    return required.response
  }

  const payload = impersonateUser(required.auth.user.id, userId, request)

  if (!payload) {
    return error(404, 'USER_NOT_FOUND', 'User was not found.')
  }

  return accepted(payload)
}

function runningAgents(request: Request) {
  const required = requireAdmin(request)

  if ('response' in required) {
    return required.response
  }

  return ok({ items: listRunningAgents() })
}

function agentLogs(request: Request) {
  const required = requireAdmin(request)

  if ('response' in required) {
    return required.response
  }

  const url = new URL(request.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 100), 1), 200)

  return ok({
    items: listAdminAgentLogs({
      limit,
      agentType: url.searchParams.get('agentType') ?? undefined,
    }),
  })
}

function disputes(request: Request) {
  const required = requireAdmin(request)

  if ('response' in required) {
    return required.response
  }

  return ok({ items: listOpenDisputes() })
}

async function disputeOverride(request: Request, disputeId: string) {
  const required = requireAdmin(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const winner = parseWinner(body.winner)
  const adminReason = typeof body.adminReason === 'string' ? body.adminReason.trim() : ''

  if (!winner) {
    return error(400, 'VALIDATION_ERROR', 'winner must be client, freelancer, or split.')
  }

  if (!adminReason) {
    return error(400, 'VALIDATION_ERROR', 'adminReason is required.')
  }

  const dispute = overrideDispute(disputeId, {
    winner,
    splitPercent: body.splitPercent === undefined ? undefined : Number(body.splitPercent),
    adminReason,
  })

  if (!dispute) {
    return error(404, 'DISPUTE_NOT_FOUND', 'Dispute was not found.')
  }

  return accepted(dispute)
}

async function broadcast(request: Request) {
  const required = requireAdmin(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const broadcastBody = typeof body.body === 'string' ? body.body.trim() : ''
  const audience = body.audience === 'paid' ? 'paid' : body.audience === 'all' ? 'all' : null

  if (!title) {
    return error(400, 'VALIDATION_ERROR', 'title is required.')
  }

  if (!broadcastBody) {
    return error(400, 'VALIDATION_ERROR', 'body is required.')
  }

  if (!audience) {
    return error(400, 'VALIDATION_ERROR', 'audience must be all or paid.')
  }

  return accepted(createBroadcast({ title, body: broadcastBody, audience }))
}

async function handle(request: Request, context: RouteContext) {
  const { path = [] } = await context.params

  if (request.method === 'GET' && path[0] === 'stats') return stats(request)
  if (request.method === 'GET' && path[0] === 'health') return health(request)
  if (request.method === 'GET' && path[0] === 'users' && path.length === 1) return users(request)
  if (request.method === 'GET' && path[0] === 'users' && path[1]) return userDetails(request, path[1])
  if (request.method === 'PATCH' && path[0] === 'users' && path[2] === 'status') return userStatus(request, path[1])
  if (request.method === 'PATCH' && path[0] === 'users' && path[2] === 'plan') return userPlan(request, path[1])
  if (request.method === 'POST' && path[0] === 'users' && path[2] === 'impersonate') return impersonate(request, path[1])
  if (request.method === 'GET' && path[0] === 'agents' && path[1] === 'running') return runningAgents(request)
  if (request.method === 'GET' && path[0] === 'agents' && path[1] === 'logs') return agentLogs(request)
  if (request.method === 'GET' && path[0] === 'disputes' && path.length === 1) return disputes(request)
  if (request.method === 'POST' && path[0] === 'disputes' && path[2] === 'override') return disputeOverride(request, path[1])
  if (request.method === 'POST' && path[0] === 'broadcast') return broadcast(request)

  return error(404, 'NOT_FOUND', `Admin endpoint ${request.method} /admin/${path.join('/')} was not found.`)
}

export const GET = handle
export const POST = handle
export const PATCH = handle
