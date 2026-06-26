import { NextResponse } from 'next/server'

import { chaseInvoice, createInvoice, getEarningsMetrics, listEarnings, listInvoices, sendInvoice } from '@/lib/earnings-store'
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

  const url = new URL(request.url)
  const status = url.searchParams.get('status') ?? undefined
  const { page, limit, offset } = getPagination(request)
  const earnings = listEarnings(required.auth.user.id, status)

  return ok({
    items: earnings.slice(offset, offset + limit),
    pagination: {
      page,
      limit,
      total: earnings.length,
      totalPages: Math.ceil(earnings.length / limit),
    },
  })
}

function metrics(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok(getEarningsMetrics(required.auth.user.id))
}

function invoices(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('status') ?? undefined

  return ok({
    items: listInvoices(required.auth.user.id, status),
  })
}

async function createInvoiceRoute(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const clientId = typeof body.clientId === 'string' ? body.clientId.trim() : ''
  const hustleId = typeof body.hustleId === 'string' ? body.hustleId.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const dueDate = typeof body.dueDate === 'string' ? body.dueDate.trim() : ''
  const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount)

  if (!clientId) {
    return error(400, 'VALIDATION_ERROR', 'clientId is required.')
  }

  if (!hustleId) {
    return error(400, 'VALIDATION_ERROR', 'hustleId is required.')
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return error(400, 'VALIDATION_ERROR', 'amount must be greater than 0.')
  }

  if (!description) {
    return error(400, 'VALIDATION_ERROR', 'description is required.')
  }

  if (!dueDate || Number.isNaN(new Date(dueDate).getTime())) {
    return error(400, 'VALIDATION_ERROR', 'dueDate must be a valid date.')
  }

  const invoice = createInvoice(required.auth.user.id, {
    clientId,
    hustleId,
    amount,
    currency: typeof body.currency === 'string' ? body.currency : 'USD',
    description,
    dueDate,
  })

  if (!invoice) {
    return error(404, 'HUSTLE_NOT_FOUND', 'Hustle was not found.')
  }

  return created(invoice)
}

function send(request: Request, invoiceId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const invoice = sendInvoice(required.auth.user.id, invoiceId)

  if (!invoice) {
    return error(404, 'INVOICE_NOT_FOUND', 'Invoice was not found.')
  }

  return accepted(invoice)
}

function chase(request: Request, invoiceId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const invoice = chaseInvoice(required.auth.user.id, invoiceId)

  if (!invoice) {
    return error(404, 'INVOICE_NOT_FOUND', 'Invoice was not found.')
  }

  return accepted(invoice)
}

function aiNextAction(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const metrics = getEarningsMetrics(required.auth.user.id)
  const outstanding = listInvoices(required.auth.user.id, 'outstanding')[0] ?? null
  const overdue = listInvoices(required.auth.user.id, 'overdue')[0] ?? null
  const invoice = overdue ?? outstanding

  return ok(
    invoice
      ? {
          invoiceId: invoice.id,
          action: invoice.status === 'overdue' ? 'start_payment_chaser' : 'review_outstanding_invoice',
          title: invoice.status === 'overdue' ? `Chase ${invoice.description}` : `Follow up on ${invoice.description}`,
          rationale: `${metrics.outstandingInvoices + metrics.overdueInvoices} invoice${metrics.outstandingInvoices + metrics.overdueInvoices === 1 ? '' : 's'} still need payment attention.`,
          estimatedImpact: {
            revenuePotential: invoice.amount,
            currency: invoice.currency,
          },
        }
      : null,
  )
}

async function handle(request: Request, context: RouteContext) {
  const { path = [] } = await context.params

  if (request.method === 'GET' && path.length === 0) return list(request)
  if (request.method === 'GET' && path[0] === 'metrics') return metrics(request)
  if (request.method === 'GET' && path[0] === 'invoices') return invoices(request)
  if (request.method === 'POST' && path[0] === 'invoices' && path.length === 1) return createInvoiceRoute(request)
  if (request.method === 'GET' && path[0] === 'ai-next-action') return aiNextAction(request)

  const [, invoiceId, action] = path

  if (request.method === 'POST' && path[0] === 'invoices' && action === 'send') return send(request, invoiceId)
  if (request.method === 'POST' && path[0] === 'invoices' && action === 'chase') return chase(request, invoiceId)

  return error(404, 'NOT_FOUND', `Earnings endpoint ${request.method} /earnings/${path.join('/')} was not found.`)
}

export const GET = handle
export const POST = handle
