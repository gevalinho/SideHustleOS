import { randomUUID } from 'crypto'

import { getHustle, listHustles } from '@/lib/hustles-store'

export type InvoiceStatus = 'draft' | 'outstanding' | 'paid' | 'overdue'

export type Invoice = {
  id: string
  userId: string
  clientId: string
  hustleId: string
  amount: number
  currency: string
  description: string
  status: InvoiceStatus
  dueDate: string
  sentAt: string | null
  paidAt: string | null
  chaserStartedAt: string | null
  createdAt: string
  updatedAt: string
}

export type Earning = {
  id: string
  userId: string
  invoiceId: string
  hustleId: string
  amount: number
  currency: string
  status: 'paid'
  description: string
  paidAt: string
  createdAt: string
}

type EarningsStore = {
  invoices: Map<string, Invoice>
  earnings: Map<string, Earning>
}

const globalForEarnings = globalThis as typeof globalThis & {
  sideHustleOsEarningsStore?: EarningsStore
}

export const earningsStore =
  globalForEarnings.sideHustleOsEarningsStore ??
  (globalForEarnings.sideHustleOsEarningsStore = {
    invoices: new Map<string, Invoice>(),
    earnings: new Map<string, Earning>(),
  })

function now() {
  return new Date().toISOString()
}

function daysFromNow(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)

  return date.toISOString().slice(0, 10)
}

function normalizeAmount(value: unknown, fallback: number) {
  const amount = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : fallback
}

export function seedEarningsForUser(userId: string) {
  const hustles = listHustles(userId)

  for (const hustle of hustles) {
    const existingForHustle = [...earningsStore.invoices.values()].some((invoice) => invoice.userId === userId && invoice.hustleId === hustle.id)

    if (existingForHustle) {
      continue
    }

    const timestamp = now()
    const paidInvoice: Invoice = {
      id: randomUUID(),
      userId,
      clientId: `client-${hustle.id.slice(0, 8)}`,
      hustleId: hustle.id,
      amount: hustle.currentRevenue,
      currency: 'USD',
      description: `${hustle.name} revenue`,
      status: 'paid',
      dueDate: daysFromNow(-4),
      sentAt: daysFromNow(-12),
      paidAt: timestamp,
      chaserStartedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    const outstandingAmount = Math.max(Math.round(hustle.targetRevenue * 0.14), 250)
    const outstandingInvoice: Invoice = {
      id: randomUUID(),
      userId,
      clientId: `client-${hustle.id.slice(0, 8)}-next`,
      hustleId: hustle.id,
      amount: outstandingAmount,
      currency: 'USD',
      description: `${hustle.name} next milestone`,
      status: 'outstanding',
      dueDate: daysFromNow(10),
      sentAt: timestamp,
      paidAt: null,
      chaserStartedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    earningsStore.invoices.set(paidInvoice.id, paidInvoice)
    earningsStore.invoices.set(outstandingInvoice.id, outstandingInvoice)
    createEarningFromInvoice(paidInvoice)
  }
}

export function listEarnings(userId: string, status?: string) {
  seedEarningsForUser(userId)

  return [...earningsStore.earnings.values()]
    .filter((earning) => earning.userId === userId)
    .filter((earning) => (status ? earning.status === status : true))
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
}

export function listInvoices(userId: string, status?: string) {
  seedEarningsForUser(userId)

  return [...earningsStore.invoices.values()]
    .filter((invoice) => invoice.userId === userId)
    .filter((invoice) => (status ? invoice.status === status : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getInvoice(userId: string, invoiceId: string) {
  seedEarningsForUser(userId)

  const invoice = earningsStore.invoices.get(invoiceId)

  if (!invoice || invoice.userId !== userId) {
    return null
  }

  return invoice
}

export function createInvoice(
  userId: string,
  input: {
    clientId: string
    hustleId: string
    amount: number
    currency?: string
    description: string
    dueDate: string
  },
) {
  const hustle = getHustle(userId, input.hustleId)

  if (!hustle) {
    return null
  }

  const timestamp = now()
  const invoice: Invoice = {
    id: randomUUID(),
    userId,
    clientId: input.clientId,
    hustleId: hustle.id,
    amount: normalizeAmount(input.amount, 0),
    currency: (input.currency || 'USD').toUpperCase(),
    description: input.description,
    status: 'draft',
    dueDate: input.dueDate,
    sentAt: null,
    paidAt: null,
    chaserStartedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  earningsStore.invoices.set(invoice.id, invoice)

  return invoice
}

export function sendInvoice(userId: string, invoiceId: string) {
  const invoice = getInvoice(userId, invoiceId)

  if (!invoice) {
    return null
  }

  const updated: Invoice = {
    ...invoice,
    status: invoice.status === 'paid' ? 'paid' : 'outstanding',
    sentAt: invoice.sentAt ?? now(),
    updatedAt: now(),
  }

  earningsStore.invoices.set(updated.id, updated)

  return updated
}

export function chaseInvoice(userId: string, invoiceId: string) {
  const invoice = getInvoice(userId, invoiceId)

  if (!invoice) {
    return null
  }

  const updated: Invoice = {
    ...invoice,
    status: invoice.status === 'paid' ? 'paid' : new Date(invoice.dueDate) < new Date() ? 'overdue' : invoice.status,
    chaserStartedAt: now(),
    updatedAt: now(),
  }

  earningsStore.invoices.set(updated.id, updated)

  return updated
}

export function getEarningsMetrics(userId: string) {
  const earnings = listEarnings(userId)
  const invoices = listInvoices(userId)
  const paid = invoices.filter((invoice) => invoice.status === 'paid')
  const outstanding = invoices.filter((invoice) => invoice.status === 'outstanding')
  const overdue = invoices.filter((invoice) => invoice.status === 'overdue')

  return {
    collected: earnings.reduce((total, earning) => total + earning.amount, 0),
    outstanding: outstanding.reduce((total, invoice) => total + invoice.amount, 0),
    overdue: overdue.reduce((total, invoice) => total + invoice.amount, 0),
    paidInvoices: paid.length,
    outstandingInvoices: outstanding.length,
    overdueInvoices: overdue.length,
    totalInvoices: invoices.length,
  }
}

function createEarningFromInvoice(invoice: Invoice) {
  const earning: Earning = {
    id: randomUUID(),
    userId: invoice.userId,
    invoiceId: invoice.id,
    hustleId: invoice.hustleId,
    amount: invoice.amount,
    currency: invoice.currency,
    status: 'paid',
    description: invoice.description,
    paidAt: invoice.paidAt ?? now(),
    createdAt: now(),
  }

  earningsStore.earnings.set(earning.id, earning)

  return earning
}
