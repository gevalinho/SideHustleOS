import { randomUUID } from 'crypto'

import { getOnboardingState } from '@/lib/onboarding-store'

export type Hustle = {
  id: string
  userId: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  skillProfileId: string
  targetRevenue: number
  currentRevenue: number
  monthlyGrowthPercent: number
  activeAgents: number
  openTasks: number
  createdAt: string
  updatedAt: string
}

export type HustleAction = {
  id: string
  hustleId: string
  userId: string
  type: string
  priority: number
  status: 'queued' | 'running' | 'complete'
  createdAt: string
}

type HustlesStore = {
  hustles: Map<string, Hustle>
  actions: Map<string, HustleAction>
}

const globalForHustles = globalThis as typeof globalThis & {
  sideHustleOsHustlesStore?: HustlesStore
}

export const hustlesStore =
  globalForHustles.sideHustleOsHustlesStore ??
  (globalForHustles.sideHustleOsHustlesStore = {
    hustles: new Map<string, Hustle>(),
    actions: new Map<string, HustleAction>(),
  })

function now() {
  return new Date().toISOString()
}

function normalizePositiveNumber(value: unknown, fallback: number) {
  const number = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(number) && number >= 0 ? number : fallback
}

export function listHustles(userId: string) {
  seedHustlesFromOnboarding(userId)

  return [...hustlesStore.hustles.values()]
    .filter((hustle) => hustle.userId === userId && hustle.status !== 'archived')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getHustle(userId: string, hustleId: string) {
  seedHustlesFromOnboarding(userId)

  const hustle = hustlesStore.hustles.get(hustleId)

  if (!hustle || hustle.userId !== userId || hustle.status === 'archived') {
    return null
  }

  return hustle
}

export function createHustle(
  userId: string,
  input: {
    id?: string
    name: string
    description: string
    skillProfileId?: string
    targetRevenue?: number
    currentRevenue?: number
  },
) {
  const timestamp = now()
  const targetRevenue = normalizePositiveNumber(input.targetRevenue, 5000)
  const hustle: Hustle = {
    id: input.id ?? randomUUID(),
    userId,
    name: input.name.trim(),
    description: input.description.trim(),
    status: 'active',
    skillProfileId: input.skillProfileId || userId,
    targetRevenue,
    currentRevenue: normalizePositiveNumber(input.currentRevenue, Math.round(targetRevenue * 0.18)),
    monthlyGrowthPercent: 18.6,
    activeAgents: 3,
    openTasks: 7,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  hustlesStore.hustles.set(hustle.id, hustle)

  return hustle
}

export function updateHustle(
  userId: string,
  hustleId: string,
  patch: Partial<Pick<Hustle, 'name' | 'description' | 'status' | 'targetRevenue' | 'currentRevenue'>>,
) {
  const hustle = getHustle(userId, hustleId)

  if (!hustle) {
    return null
  }

  const updated: Hustle = {
    ...hustle,
    ...patch,
    targetRevenue: patch.targetRevenue === undefined ? hustle.targetRevenue : normalizePositiveNumber(patch.targetRevenue, hustle.targetRevenue),
    currentRevenue: patch.currentRevenue === undefined ? hustle.currentRevenue : normalizePositiveNumber(patch.currentRevenue, hustle.currentRevenue),
    updatedAt: now(),
  }

  hustlesStore.hustles.set(updated.id, updated)

  return updated
}

export function createHustleAction(userId: string, hustleId: string, input: { type: string; priority?: number }) {
  const hustle = getHustle(userId, hustleId)

  if (!hustle) {
    return null
  }

  const action: HustleAction = {
    id: randomUUID(),
    userId,
    hustleId,
    type: input.type,
    priority: normalizePositiveNumber(input.priority, 1),
    status: 'queued',
    createdAt: now(),
  }

  hustlesStore.actions.set(action.id, action)

  return action
}

export function seedHustlesFromOnboarding(userId: string) {
  const state = getOnboardingState(userId)

  if (!state.selectedHustleId || state.selectedBusinessIndex === null) {
    return
  }

  if (hustlesStore.hustles.has(state.selectedHustleId)) {
    return
  }

  const selectedBusiness = state.businessOptions.find((option) => option.index === state.selectedBusinessIndex)

  if (!selectedBusiness) {
    return
  }

  createHustle(userId, {
    id: state.selectedHustleId,
    name: selectedBusiness.name,
    description: selectedBusiness.offer,
    skillProfileId: userId,
    targetRevenue: 5000,
    currentRevenue: 850,
  })
}

export function getHustleMetrics(userId: string) {
  const hustles = listHustles(userId)
  const active = hustles.filter((hustle) => hustle.status === 'active')
  const totalRevenue = hustles.reduce((total, hustle) => total + hustle.currentRevenue, 0)
  const targetRevenue = hustles.reduce((total, hustle) => total + hustle.targetRevenue, 0)

  return {
    total: hustles.length,
    active: active.length,
    paused: hustles.filter((hustle) => hustle.status === 'paused').length,
    totalRevenue,
    targetRevenue,
    averageGrowthPercent: hustles.length
      ? Number((hustles.reduce((total, hustle) => total + hustle.monthlyGrowthPercent, 0) / hustles.length).toFixed(1))
      : 0,
    openTasks: hustles.reduce((total, hustle) => total + hustle.openTasks, 0),
    activeAgents: hustles.reduce((total, hustle) => total + hustle.activeAgents, 0),
  }
}

export function getHustlePerformance(hustle: Hustle, days: number) {
  const count = Math.min(Math.max(days, 1), 90)
  const dailyBase = hustle.currentRevenue / count

  return Array.from({ length: count }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (count - index - 1))

    return {
      date: date.toISOString().slice(0, 10),
      revenue: Math.round(dailyBase * (0.7 + index / count)),
      leads: 4 + ((index * 3) % 9),
      replies: 1 + ((index * 2) % 5),
    }
  })
}
