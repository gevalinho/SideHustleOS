import { NextResponse } from 'next/server'

import { getOpportunityMetrics, listOpportunities, updateOpportunityStatus } from '@/lib/opportunities-store'
import { getRequestAuth } from '@/lib/request-auth'

type RouteContext = {
  params: Promise<{
    path?: string[]
  }>
}

function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init)
}

function accepted(data: unknown) {
  return ok(data, { status: 202 })
}

function error(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
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

  const confidence = new URL(request.url).searchParams.get('confidence') ?? undefined

  return ok({
    items: listOpportunities(required.auth.user.id, confidence),
  })
}

function metrics(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok(getOpportunityMetrics(required.auth.user.id))
}

function updateStatus(request: Request, opportunityId: string, status: 'pursued' | 'dismissed') {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const opportunity = updateOpportunityStatus(required.auth.user.id, opportunityId, status)

  if (!opportunity) {
    return error(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity was not found.')
  }

  return accepted(opportunity)
}

async function handle(request: Request, context: RouteContext) {
  const { path = [] } = await context.params

  if (request.method === 'GET' && path.length === 0) return list(request)
  if (request.method === 'GET' && path[0] === 'metrics') return metrics(request)

  const [opportunityId, action] = path

  if (request.method === 'POST' && action === 'pursue') return updateStatus(request, opportunityId, 'pursued')
  if (request.method === 'POST' && action === 'dismiss') return updateStatus(request, opportunityId, 'dismissed')

  return error(404, 'NOT_FOUND', `Opportunities endpoint ${request.method} /opportunities/${path.join('/')} was not found.`)
}

export const GET = handle
export const POST = handle
