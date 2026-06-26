import { NextResponse } from 'next/server'

import { createClient, getClient, getClientMetrics, listClientInvoices, listClients, updateClient } from '@/lib/clients-store'
import { getRequestAuth } from '@/lib/request-auth'
import type { ClientStatus } from '@/lib/clients-store'

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

function parseStatus(value: unknown): ClientStatus | undefined {
  return ['prospect', 'active', 'past'].includes(String(value)) ? (value as ClientStatus) : undefined
}

function list(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok({
    items: listClients(required.auth.user.id),
  })
}

function metrics(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok(getClientMetrics(required.auth.user.id))
}

async function create(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const company = typeof body.company === 'string' ? body.company.trim() : ''
  const hustleId = typeof body.hustleId === 'string' ? body.hustleId.trim() : ''

  if (!name) return error(400, 'VALIDATION_ERROR', 'name is required.')
  if (!email) return error(400, 'VALIDATION_ERROR', 'email is required.')
  if (!company) return error(400, 'VALIDATION_ERROR', 'company is required.')
  if (!hustleId) return error(400, 'VALIDATION_ERROR', 'hustleId is required.')

  const client = createClient(required.auth.user.id, {
    name,
    email,
    company,
    phone: typeof body.phone === 'string' ? body.phone : '',
    hustleId,
  })

  if (!client) {
    return error(404, 'HUSTLE_NOT_FOUND', 'Hustle was not found.')
  }

  return created(client)
}

function getById(request: Request, clientId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const client = getClient(required.auth.user.id, clientId)

  if (!client) {
    return error(404, 'CLIENT_NOT_FOUND', 'Client was not found.')
  }

  return ok(client)
}

async function patch(request: Request, clientId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const updated = updateClient(required.auth.user.id, clientId, {
    name: typeof body.name === 'string' ? body.name.trim() : undefined,
    email: typeof body.email === 'string' ? body.email.trim() : undefined,
    company: typeof body.company === 'string' ? body.company.trim() : undefined,
    phone: typeof body.phone === 'string' ? body.phone.trim() : undefined,
    status: parseStatus(body.status),
    totalRevenue: body.totalRevenue === undefined ? undefined : Number(body.totalRevenue),
  })

  if (!updated) {
    return error(404, 'CLIENT_NOT_FOUND', 'Client was not found.')
  }

  return ok(updated)
}

function invoices(request: Request, clientId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const items = listClientInvoices(required.auth.user.id, clientId)

  if (!items) {
    return error(404, 'CLIENT_NOT_FOUND', 'Client was not found.')
  }

  return ok({ items })
}

async function handle(request: Request, context: RouteContext) {
  const { path = [] } = await context.params

  if (request.method === 'GET' && path.length === 0) return list(request)
  if (request.method === 'GET' && path[0] === 'metrics') return metrics(request)
  if (request.method === 'POST' && path.length === 0) return create(request)

  const [clientId, child] = path

  if (request.method === 'GET' && path.length === 1) return getById(request, clientId)
  if (request.method === 'PATCH' && path.length === 1) return patch(request, clientId)
  if (request.method === 'GET' && child === 'invoices') return invoices(request, clientId)

  return error(404, 'NOT_FOUND', `Clients endpoint ${request.method} /clients/${path.join('/')} was not found.`)
}

export const GET = handle
export const POST = handle
export const PATCH = handle
