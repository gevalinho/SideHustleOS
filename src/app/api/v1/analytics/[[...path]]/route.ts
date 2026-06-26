import { NextResponse } from 'next/server'

import { getAgentAnalytics, getAnalyticsSummary, getOutreachAnalytics, getRevenueAnalytics } from '@/lib/analytics-store'
import { getRequestAuth } from '@/lib/request-auth'

type RouteContext = {
  params: Promise<{
    path?: string[]
  }>
}

function ok(data: unknown) {
  return NextResponse.json({ success: true, data })
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

function summary(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok(getAnalyticsSummary(required.auth.user.id))
}

function revenue(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const url = new URL(request.url)

  return ok(
    getRevenueAnalytics(required.auth.user.id, {
      days: url.searchParams.get('days'),
      granularity: url.searchParams.get('granularity') ?? undefined,
    }),
  )
}

function outreach(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok(getOutreachAnalytics(required.auth.user.id))
}

function agents(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok(getAgentAnalytics(required.auth.user.id))
}

async function handle(request: Request, context: RouteContext) {
  const { path = [] } = await context.params

  if (request.method === 'GET' && path[0] === 'summary') return summary(request)
  if (request.method === 'GET' && path[0] === 'revenue') return revenue(request)
  if (request.method === 'GET' && path[0] === 'outreach') return outreach(request)
  if (request.method === 'GET' && path[0] === 'agents') return agents(request)

  return error(404, 'NOT_FOUND', `Analytics endpoint ${request.method} /analytics/${path.join('/')} was not found.`)
}

export const GET = handle
