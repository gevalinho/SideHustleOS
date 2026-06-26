import { NextResponse } from 'next/server'

import { applyTopUp, getBillingStatus, getPricing, upgradeBillingPlan } from '@/lib/billing-store'
import { getRequestAuth } from '@/lib/request-auth'
import type { BillingPlan } from '@/lib/billing-store'

type RouteContext = {
  params: Promise<{
    path?: string[]
  }>
}

type JsonObject = Record<string, unknown>

function ok(data: unknown) {
  return NextResponse.json({ success: true, data })
}

function accepted(data: unknown) {
  return NextResponse.json({ success: true, data }, { status: 202 })
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

function parseBillingPlan(value: unknown): BillingPlan | null {
  return ['free', 'starter', 'pro', 'revenue_share'].includes(String(value)) ? (value as BillingPlan) : null
}

function pricing() {
  return ok(getPricing())
}

function status(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok(getBillingStatus(required.auth.user.id))
}

async function upgrade(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const plan = parseBillingPlan(body.plan)

  if (!plan || plan === 'free') {
    return error(400, 'VALIDATION_ERROR', 'plan must be starter, pro, or revenue_share.')
  }

  const billing = upgradeBillingPlan(required.auth.user.id, plan)

  if (!billing) {
    return error(404, 'USER_NOT_FOUND', 'User was not found.')
  }

  return accepted(billing)
}

async function topUp(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const topUpKey = typeof body.topUpKey === 'string' ? body.topUpKey : ''
  const billing = applyTopUp(required.auth.user.id, topUpKey)

  if (!billing) {
    return error(400, 'VALIDATION_ERROR', 'topUpKey is invalid.')
  }

  return accepted(billing)
}

async function handle(request: Request, context: RouteContext) {
  const { path = [] } = await context.params

  if (request.method === 'GET' && path[0] === 'pricing') return pricing()
  if (request.method === 'GET' && path[0] === 'status') return status(request)
  if (request.method === 'POST' && path[0] === 'upgrade') return upgrade(request)
  if (request.method === 'POST' && path[0] === 'top-up') return topUp(request)

  return error(404, 'NOT_FOUND', `Billing endpoint ${request.method} /billing/${path.join('/')} was not found.`)
}

export const GET = handle
export const POST = handle
