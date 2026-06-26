import { NextResponse } from 'next/server'

import { getSettingsMetrics, getUserSettings, updateAgentLimits, updateApprovalRules } from '@/lib/settings-store'
import { getRequestAuth } from '@/lib/request-auth'
import type { ApprovalMode } from '@/lib/settings-store'

type RouteContext = {
  params: Promise<{
    path?: string[]
  }>
}

type JsonObject = Record<string, unknown>

function ok(data: unknown) {
  return NextResponse.json({ success: true, data })
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

function parseApprovalMode(value: unknown): ApprovalMode | undefined {
  return ['manual', 'balanced', 'autopilot'].includes(String(value)) ? (value as ApprovalMode) : undefined
}

function getAll(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok(getUserSettings(required.auth.user.id))
}

function metrics(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok(getSettingsMetrics(required.auth.user.id))
}

async function patchApprovalRules(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)

  return ok(
    updateApprovalRules(required.auth.user.id, {
      mode: parseApprovalMode(body.mode),
      requireApprovalFor: Array.isArray(body.requireApprovalFor) ? body.requireApprovalFor : undefined,
      activeRuleCount: body.activeRuleCount === undefined ? undefined : Number(body.activeRuleCount),
    }),
  )
}

async function patchAgentLimits(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)

  return ok(
    updateAgentLimits(required.auth.user.id, {
      dailyEmailCap: body.dailyEmailCap === undefined ? undefined : Number(body.dailyEmailCap),
      monthlyAdSpendCap: body.monthlyAdSpendCap === undefined ? undefined : Number(body.monthlyAdSpendCap),
      maxConcurrentAgents: body.maxConcurrentAgents === undefined ? undefined : Number(body.maxConcurrentAgents),
    }),
  )
}

async function handle(request: Request, context: RouteContext) {
  const { path = [] } = await context.params

  if (request.method === 'GET' && path.length === 0) return getAll(request)
  if (request.method === 'GET' && path[0] === 'metrics') return metrics(request)
  if (request.method === 'PATCH' && path[0] === 'approval-rules') return patchApprovalRules(request)
  if (request.method === 'PATCH' && path[0] === 'agent-limits') return patchAgentLimits(request)

  return error(404, 'NOT_FOUND', `Settings endpoint ${request.method} /settings/${path.join('/')} was not found.`)
}

export const GET = handle
export const PATCH = handle
