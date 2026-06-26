import { randomUUID } from 'crypto'

import { listInvoices } from '@/lib/earnings-store'
import { getHustle, listHustles } from '@/lib/hustles-store'

export type ClientStatus = 'prospect' | 'active' | 'past'

export type Client = {
  id: string
  userId: string
  hustleId: string
  name: string
  email: string
  company: string
  phone: string
  status: ClientStatus
  totalRevenue: number
  lastContactAt: string | null
  createdAt: string
  updatedAt: string
}

type ClientsStore = {
  clients: Map<string, Client>
}

const globalForClients = globalThis as typeof globalThis & {
  sideHustleOsClientsStore?: ClientsStore
}

export const clientsStore =
  globalForClients.sideHustleOsClientsStore ??
  (globalForClients.sideHustleOsClientsStore = {
    clients: new Map<string, Client>(),
  })

function now() {
  return new Date().toISOString()
}

function normalizeRevenue(value: unknown) {
  const amount = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : 0
}

export function seedClientsForUser(userId: string) {
  const hustles = listHustles(userId)
  const invoices = listInvoices(userId)

  for (const hustle of hustles) {
    const existingForHustle = [...clientsStore.clients.values()].some((client) => client.userId === userId && client.hustleId === hustle.id)

    if (existingForHustle) {
      continue
    }

    const timestamp = now()
    const relatedInvoices = invoices.filter((invoice) => invoice.hustleId === hustle.id)
    const primaryInvoice = relatedInvoices[0]
    const client: Client = {
      id: primaryInvoice?.clientId ?? `client-${hustle.id.slice(0, 8)}`,
      userId,
      hustleId: hustle.id,
      name: `${hustle.name} Buyer`,
      email: `client-${hustle.id.slice(0, 8)}@example.com`,
      company: `${hustle.name} Account`,
      phone: '',
      status: relatedInvoices.some((invoice) => invoice.status === 'paid') ? 'active' : 'prospect',
      totalRevenue: relatedInvoices.filter((invoice) => invoice.status === 'paid').reduce((total, invoice) => total + invoice.amount, 0),
      lastContactAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    clientsStore.clients.set(client.id, client)
  }
}

export function listClients(userId: string) {
  seedClientsForUser(userId)

  return [...clientsStore.clients.values()]
    .filter((client) => client.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getClient(userId: string, clientId: string) {
  seedClientsForUser(userId)

  const client = clientsStore.clients.get(clientId)

  if (!client || client.userId !== userId) {
    return null
  }

  return client
}

export function createClient(
  userId: string,
  input: {
    name: string
    email: string
    company: string
    phone?: string
    hustleId: string
  },
) {
  const hustle = getHustle(userId, input.hustleId)

  if (!hustle) {
    return null
  }

  const timestamp = now()
  const client: Client = {
    id: randomUUID(),
    userId,
    hustleId: hustle.id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    company: input.company.trim(),
    phone: input.phone?.trim() ?? '',
    status: 'prospect',
    totalRevenue: 0,
    lastContactAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  clientsStore.clients.set(client.id, client)

  return client
}

export function updateClient(
  userId: string,
  clientId: string,
  patch: Partial<Pick<Client, 'name' | 'email' | 'company' | 'phone' | 'status' | 'totalRevenue' | 'lastContactAt'>>,
) {
  const client = getClient(userId, clientId)

  if (!client) {
    return null
  }

  const updated: Client = {
    ...client,
    ...patch,
    email: patch.email ? patch.email.trim().toLowerCase() : client.email,
    totalRevenue: patch.totalRevenue === undefined ? client.totalRevenue : normalizeRevenue(patch.totalRevenue),
    updatedAt: now(),
  }

  clientsStore.clients.set(updated.id, updated)

  return updated
}

export function listClientInvoices(userId: string, clientId: string) {
  const client = getClient(userId, clientId)

  if (!client) {
    return null
  }

  return listInvoices(userId).filter((invoice) => invoice.clientId === clientId)
}

export function getClientMetrics(userId: string) {
  const clients = listClients(userId)
  const totalRevenue = clients.reduce((total, client) => total + client.totalRevenue, 0)

  return {
    total: clients.length,
    active: clients.filter((client) => client.status === 'active').length,
    prospects: clients.filter((client) => client.status === 'prospect').length,
    past: clients.filter((client) => client.status === 'past').length,
    totalRevenue,
    averageClientValue: clients.length ? Math.round(totalRevenue / clients.length) : 0,
  }
}
