import { randomUUID } from 'crypto'

type SkillSource =
  | {
      type: 'text'
      value: string
    }
  | {
      type: 'cv'
      fileName: string
      bytesApprox: number
    }

export type BusinessOption = {
  index: number
  name: string
  skill: string
  customerProfile: string
  offer: string
  pricing: string
  confidence: 'high' | 'medium'
  estimatedTimeToFirstDollar: string
  firstActions: string[]
}

export type OnboardingState = {
  userId: string
  currentStep: number
  completedSteps: number[]
  completed: boolean
  skillSource: SkillSource | null
  extractedSkills: string[]
  businessOptions: BusinessOption[]
  selectedBusinessIndex: number | null
  selectedHustleId: string | null
  gmailConnected: boolean
  createdAt: string
  updatedAt: string
}

type OnboardingStore = {
  states: Map<string, OnboardingState>
}

const globalForOnboarding = globalThis as typeof globalThis & {
  sideHustleOsOnboardingStore?: OnboardingStore
}

export const onboardingStore =
  globalForOnboarding.sideHustleOsOnboardingStore ??
  (globalForOnboarding.sideHustleOsOnboardingStore = {
    states: new Map<string, OnboardingState>(),
  })

export function getOnboardingState(userId: string) {
  const existing = onboardingStore.states.get(userId)

  if (existing) {
    return existing
  }

  const now = new Date().toISOString()
  const state: OnboardingState = {
    userId,
    currentStep: 1,
    completedSteps: [1],
    completed: false,
    skillSource: null,
    extractedSkills: [],
    businessOptions: [],
    selectedBusinessIndex: null,
    selectedHustleId: null,
    gmailConnected: false,
    createdAt: now,
    updatedAt: now,
  }

  onboardingStore.states.set(userId, state)

  return state
}

export function updateOnboardingState(userId: string, patch: Partial<OnboardingState>) {
  const current = getOnboardingState(userId)
  const next = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  }

  onboardingStore.states.set(userId, next)

  return next
}

export function completeSteps(existing: number[], ...steps: number[]) {
  return [...new Set([...existing, ...steps])].sort((a, b) => a - b)
}

export function extractSkillsFromText(text: string) {
  const lower = text.toLowerCase()
  const skillDetectors: Array<[string, string[]]> = [
    ['React development', ['react', 'frontend', 'front-end']],
    ['SaaS dashboard design', ['saas', 'dashboard']],
    ['Design systems', ['design system']],
    ['Figma UI design', ['figma', 'ui design']],
    ['Technical documentation', ['documentation', 'technical writing']],
    ['Startup product leadership', ['startup', 'lead']],
  ]

  const detected = skillDetectors
    .filter(([, keywords]) => keywords.some((keyword) => lower.includes(keyword)))
    .map(([skill]) => skill)

  return detected.length ? detected : ['Productized service delivery', 'Client communication', 'Automation operations']
}

export function generateBusinessOptions(skills: string[]) {
  const primary = skills[0] ?? 'Productized service delivery'
  const secondary = skills[1] ?? 'Automation operations'
  const tertiary = skills[2] ?? 'Client communication'

  return [
    {
      index: 0,
      name: `${primary} Sprint Studio`,
      skill: primary,
      customerProfile: 'Early-stage founders who need a polished revenue-facing experience quickly.',
      offer: 'A 7-day dashboard or landing-page sprint with copy, UI, and implementation.',
      pricing: '$1,500 fixed-price starter sprint',
      confidence: 'high' as const,
      estimatedTimeToFirstDollar: '10-14 days',
      firstActions: ['Create one-page offer', 'Build 50-lead prospect list', 'Send founder-focused outreach'],
    },
    {
      index: 1,
      name: `${secondary} Retainer`,
      skill: secondary,
      customerProfile: 'Small SaaS teams with inconsistent UI patterns and slow delivery cycles.',
      offer: 'Monthly design-system cleanup, component documentation, and dashboard iteration support.',
      pricing: '$2,000/month retainer',
      confidence: 'high' as const,
      estimatedTimeToFirstDollar: '21-30 days',
      firstActions: ['Package audit checklist', 'Draft retainer proposal', 'Target funded SaaS teams'],
    },
    {
      index: 2,
      name: `${tertiary} Content Engine`,
      skill: tertiary,
      customerProfile: 'Technical founders who need clear docs, launch posts, and customer education.',
      offer: 'Turn product knowledge into docs, case studies, and short-form launch content.',
      pricing: '$900/week content pod',
      confidence: 'medium' as const,
      estimatedTimeToFirstDollar: '14-21 days',
      firstActions: ['Create sample before/after doc', 'Write outreach angle', 'Find documentation-heavy products'],
    },
  ]
}

export function selectBusiness(userId: string, index: number) {
  const state = getOnboardingState(userId)
  const selected = state.businessOptions.find((option) => option.index === index)

  if (!selected) {
    return null
  }

  const hustleId = state.selectedBusinessIndex === index && state.selectedHustleId ? state.selectedHustleId : randomUUID()

  return updateOnboardingState(userId, {
    currentStep: Math.max(state.currentStep, 4),
    completedSteps: completeSteps(state.completedSteps, 3),
    selectedBusinessIndex: index,
    selectedHustleId: hustleId,
  })
}

export function isOnboardingComplete(userId: string) {
  return getOnboardingState(userId).completed
}
