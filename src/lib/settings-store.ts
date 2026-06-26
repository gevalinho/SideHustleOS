export type ApprovalMode = 'manual' | 'balanced' | 'autopilot'

export type ApprovalRules = {
  mode: ApprovalMode
  requireApprovalFor: string[]
  activeRuleCount: number
}

export type AgentLimits = {
  dailyEmailCap: number
  monthlyAdSpendCap: number
  maxConcurrentAgents: number
}

export type UserSettings = {
  userId: string
  approvalRules: ApprovalRules
  agentLimits: AgentLimits
  createdAt: string
  updatedAt: string
}

type SettingsStore = {
  settings: Map<string, UserSettings>
}

const globalForSettings = globalThis as typeof globalThis & {
  sideHustleOsSettingsStore?: SettingsStore
}

export const settingsStore =
  globalForSettings.sideHustleOsSettingsStore ??
  (globalForSettings.sideHustleOsSettingsStore = {
    settings: new Map<string, UserSettings>(),
  })

function now() {
  return new Date().toISOString()
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  const number = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(number) && number >= 0 ? Math.round(number) : fallback
}

export function getUserSettings(userId: string) {
  const existing = settingsStore.settings.get(userId)

  if (existing) {
    return existing
  }

  const timestamp = now()
  const settings: UserSettings = {
    userId,
    approvalRules: {
      mode: 'balanced',
      requireApprovalFor: ['replies', 'invoices'],
      activeRuleCount: 2,
    },
    agentLimits: {
      dailyEmailCap: 50,
      monthlyAdSpendCap: 450,
      maxConcurrentAgents: 7,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  settingsStore.settings.set(userId, settings)

  return settings
}

export function updateApprovalRules(userId: string, input: Partial<ApprovalRules>) {
  const current = getUserSettings(userId)
  const mode = ['manual', 'balanced', 'autopilot'].includes(String(input.mode)) ? (input.mode as ApprovalMode) : current.approvalRules.mode
  const requireApprovalFor = Array.isArray(input.requireApprovalFor)
    ? input.requireApprovalFor.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => item.trim())
    : current.approvalRules.requireApprovalFor
  const updated: UserSettings = {
    ...current,
    approvalRules: {
      mode,
      requireApprovalFor,
      activeRuleCount: normalizePositiveInteger(input.activeRuleCount, requireApprovalFor.length),
    },
    updatedAt: now(),
  }

  settingsStore.settings.set(userId, updated)

  return updated
}

export function updateAgentLimits(userId: string, input: Partial<AgentLimits>) {
  const current = getUserSettings(userId)
  const updated: UserSettings = {
    ...current,
    agentLimits: {
      dailyEmailCap: normalizePositiveInteger(input.dailyEmailCap, current.agentLimits.dailyEmailCap),
      monthlyAdSpendCap: normalizePositiveInteger(input.monthlyAdSpendCap, current.agentLimits.monthlyAdSpendCap),
      maxConcurrentAgents: normalizePositiveInteger(input.maxConcurrentAgents, current.agentLimits.maxConcurrentAgents),
    },
    updatedAt: now(),
  }

  settingsStore.settings.set(userId, updated)

  return updated
}

export function getSettingsMetrics(userId: string) {
  const settings = getUserSettings(userId)

  return {
    approvalMode: settings.approvalRules.mode,
    activeRuleCount: settings.approvalRules.activeRuleCount,
    dailyEmailCap: settings.agentLimits.dailyEmailCap,
    monthlyAdSpendCap: settings.agentLimits.monthlyAdSpendCap,
    maxConcurrentAgents: settings.agentLimits.maxConcurrentAgents,
  }
}
