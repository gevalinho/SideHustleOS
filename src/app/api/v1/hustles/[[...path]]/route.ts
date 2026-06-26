import { NextResponse } from 'next/server'

import {
  createHustle,
  createHustleAction,
  getHustle,
  getHustleMetrics,
  getHustlePerformance,
  listHustles,
  updateHustle,
} from '@/lib/hustles-store'
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

function created(data: unknown) {
  return ok(data, { status: 201 })
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

function getPagination(request: Request) {
  const url = new URL(request.url)
  const page = Math.max(Number(url.searchParams.get('page') ?? 1), 1)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 20), 1), 100)

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  }
}

function list(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const { page, limit, offset } = getPagination(request)
  const hustles = listHustles(required.auth.user.id)

  return ok({
    items: hustles.slice(offset, offset + limit),
    pagination: {
      page,
      limit,
      total: hustles.length,
      totalPages: Math.ceil(hustles.length / limit),
    },
  })
}

function metrics(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok(getHustleMetrics(required.auth.user.id))
}

function priority(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const hustles = listHustles(required.auth.user.id)
  const topHustle = [...hustles].sort((a, b) => b.currentRevenue - a.currentRevenue)[0] ?? null

  return ok({
    topHustle,
    nextActions: hustles.slice(0, 3).map((hustle) => ({
      hustleId: hustle.id,
      title: `Increase qualified leads for ${hustle.name}`,
      impact: 'high',
      reason: `${hustle.openTasks} open tasks and ${hustle.activeAgents} agents available.`,
    })),
  })
}

async function create(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''

  if (!name) {
    return error(400, 'VALIDATION_ERROR', 'name is required.')
  }

  if (!description) {
    return error(400, 'VALIDATION_ERROR', 'description is required.')
  }

  const hustle = createHustle(required.auth.user.id, {
    name,
    description,
    skillProfileId: typeof body.skillProfileId === 'string' ? body.skillProfileId : required.auth.user.id,
    targetRevenue: typeof body.targetRevenue === 'number' ? body.targetRevenue : Number(body.targetRevenue ?? 5000),
  })

  return created(hustle)
}

function getById(request: Request, hustleId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const hustle = getHustle(required.auth.user.id, hustleId)

  if (!hustle) {
    return error(404, 'HUSTLE_NOT_FOUND', 'Hustle was not found.')
  }

  return ok(hustle)
}

async function patch(request: Request, hustleId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const updated = updateHustle(required.auth.user.id, hustleId, {
    name: typeof body.name === 'string' ? body.name.trim() : undefined,
    description: typeof body.description === 'string' ? body.description.trim() : undefined,
    status: ['draft', 'active', 'paused', 'archived'].includes(String(body.status)) ? (body.status as 'draft' | 'active' | 'paused' | 'archived') : undefined,
    targetRevenue: body.targetRevenue === undefined ? undefined : Number(body.targetRevenue),
    currentRevenue: body.currentRevenue === undefined ? undefined : Number(body.currentRevenue),
  })

  if (!updated) {
    return error(404, 'HUSTLE_NOT_FOUND', 'Hustle was not found.')
  }

  return ok(updated)
}

function aiNextAction(request: Request, hustleId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const hustle = getHustle(required.auth.user.id, hustleId)

  if (!hustle) {
    return error(404, 'HUSTLE_NOT_FOUND', 'Hustle was not found.')
  }

  return ok({
    hustleId: hustle.id,
    action: 'hunt_prospects',
    title: `Find 25 prospects for ${hustle.name}`,
    rationale: 'Prospect volume is the highest leverage next step for validating this offer.',
    estimatedImpact: {
      leads: 25,
      replies: 4,
      revenuePotential: Math.round(hustle.targetRevenue * 0.2),
    },
  })
}

function performance(request: Request, hustleId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const hustle = getHustle(required.auth.user.id, hustleId)

  if (!hustle) {
    return error(404, 'HUSTLE_NOT_FOUND', 'Hustle was not found.')
  }

  const days = Number(new URL(request.url).searchParams.get('days') ?? 7)

  return ok({
    hustleId: hustle.id,
    days: Math.min(Math.max(days, 1), 90),
    series: getHustlePerformance(hustle, days),
  })
}

function checklist(request: Request, hustleId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const hustle = getHustle(required.auth.user.id, hustleId)

  if (!hustle) {
    return error(404, 'HUSTLE_NOT_FOUND', 'Hustle was not found.')
  }

  return ok({
    hustleId: hustle.id,
    items: [
      { id: 'offer', title: 'Finalize offer promise', complete: true },
      { id: 'prospects', title: 'Build first 50-prospect list', complete: false },
      { id: 'outreach', title: 'Approve first outreach sequence', complete: false },
      { id: 'invoice', title: 'Prepare invoice template', complete: hustle.currentRevenue > 0 },
    ],
  })
}

async function triggerAction(request: Request, hustleId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const type = typeof body.type === 'string' ? body.type.trim() : ''

  if (!type) {
    return error(400, 'VALIDATION_ERROR', 'type is required.')
  }

  const action = createHustleAction(required.auth.user.id, hustleId, {
    type,
    priority: typeof body.priority === 'number' ? body.priority : Number(body.priority ?? 1),
  })

  if (!action) {
    return error(404, 'HUSTLE_NOT_FOUND', 'Hustle was not found.')
  }

  return accepted(action)
}

async function handle(request: Request, context: RouteContext) {
  const { path = [] } = await context.params

  if (request.method === 'GET' && path.length === 0) return list(request)
  if (request.method === 'POST' && path.length === 0) return create(request)
  if (request.method === 'GET' && path[0] === 'metrics') return metrics(request)
  if (request.method === 'GET' && path[0] === 'priority') return priority(request)

  const [hustleId, child] = path

  if (!hustleId) {
    return error(404, 'NOT_FOUND', `Hustles endpoint ${request.method} /hustles was not found.`)
  }

  if (request.method === 'GET' && path.length === 1) return getById(request, hustleId)
  if (request.method === 'PATCH' && path.length === 1) return patch(request, hustleId)
  if (request.method === 'GET' && child === 'ai-next-action') return aiNextAction(request, hustleId)
  if (request.method === 'GET' && child === 'performance') return performance(request, hustleId)
  if (request.method === 'GET' && child === 'checklist') return checklist(request, hustleId)
  if (request.method === 'POST' && child === 'actions') return triggerAction(request, hustleId)

  return error(404, 'NOT_FOUND', `Hustles endpoint ${request.method} /hustles/${path.join('/')} was not found.`)
}

export const GET = handle
export const POST = handle
export const PATCH = handle

