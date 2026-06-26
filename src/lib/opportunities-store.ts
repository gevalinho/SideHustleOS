import { randomUUID } from 'crypto'

import { listHustles } from '@/lib/hustles-store'

export type OpportunityConfidence = 'high' | 'medium' | 'low'
export type OpportunityStatus = 'open' | 'pursued' | 'dismissed'

export type Opportunity = {
  id: string
  userId: string
  hustleId: string
  title: string
  description: string
  confidence: OpportunityConfidence
  matchScore: number
  estimatedValue: number
  currency: string
  source: 'prospect_match' | 'upsell' | 'offer_optimization'
  status: OpportunityStatus
  createdAt: string
  updatedAt: string
}

type OpportunitiesStore = {
  opportunities: Map<string, Opportunity>
}

const globalForOpportunities = globalThis as typeof globalThis & {
  sideHustleOsOpportunitiesStore?: OpportunitiesStore
}

export const opportunitiesStore =
  globalForOpportunities.sideHustleOsOpportunitiesStore ??
  (globalForOpportunities.sideHustleOsOpportunitiesStore = {
    opportunities: new Map<string, Opportunity>(),
  })

function now() {
  return new Date().toISOString()
}

const templates: Array<{
  title: string
  description: string
  confidence: OpportunityConfidence
  matchScore: number
  valueShare: number
  source: Opportunity['source']
}> = [
  {
    title: 'High-fit prospects',
    description: 'A qualified prospect batch matches this offer and is ready for outreach.',
    confidence: 'high',
    matchScore: 98,
    valueShare: 0.28,
    source: 'prospect_match',
  },
  {
    title: 'Retainer upsell',
    description: 'Current delivery scope can be packaged into a recurring support offer.',
    confidence: 'high',
    matchScore: 91,
    valueShare: 0.22,
    source: 'upsell',
  },
  {
    title: 'Offer optimization',
    description: 'Pricing and promise language can be tightened before the next campaign.',
    confidence: 'medium',
    matchScore: 84,
    valueShare: 0.16,
    source: 'offer_optimization',
  },
]

export function seedOpportunitiesForUser(userId: string) {
  const hustles = listHustles(userId)

  for (const hustle of hustles) {
    const existingForHustle = [...opportunitiesStore.opportunities.values()].some((opportunity) => opportunity.userId === userId && opportunity.hustleId === hustle.id)

    if (existingForHustle) {
      continue
    }

    templates.forEach((template, index) => {
      const timestamp = now()
      const opportunity: Opportunity = {
        id: randomUUID(),
        userId,
        hustleId: hustle.id,
        title: template.title,
        description: `${hustle.name}: ${template.description}`,
        confidence: template.confidence,
        matchScore: Math.max(template.matchScore - index * 2, 60),
        estimatedValue: Math.round(hustle.targetRevenue * template.valueShare),
        currency: 'USD',
        source: template.source,
        status: 'open',
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      opportunitiesStore.opportunities.set(opportunity.id, opportunity)
    })
  }
}

export function listOpportunities(userId: string, confidence?: string) {
  seedOpportunitiesForUser(userId)

  return [...opportunitiesStore.opportunities.values()]
    .filter((opportunity) => opportunity.userId === userId && opportunity.status !== 'dismissed')
    .filter((opportunity) => (confidence ? opportunity.confidence === confidence : true))
    .sort((a, b) => b.matchScore - a.matchScore || b.updatedAt.localeCompare(a.updatedAt))
}

export function getOpportunity(userId: string, opportunityId: string) {
  seedOpportunitiesForUser(userId)

  const opportunity = opportunitiesStore.opportunities.get(opportunityId)

  if (!opportunity || opportunity.userId !== userId || opportunity.status === 'dismissed') {
    return null
  }

  return opportunity
}

export function updateOpportunityStatus(userId: string, opportunityId: string, status: Extract<OpportunityStatus, 'pursued' | 'dismissed'>) {
  const opportunity = getOpportunity(userId, opportunityId)

  if (!opportunity) {
    return null
  }

  const updated: Opportunity = {
    ...opportunity,
    status,
    updatedAt: now(),
  }

  opportunitiesStore.opportunities.set(updated.id, updated)

  return updated
}

export function getOpportunityMetrics(userId: string) {
  seedOpportunitiesForUser(userId)

  const all = [...opportunitiesStore.opportunities.values()].filter((opportunity) => opportunity.userId === userId)
  const visible = all.filter((opportunity) => opportunity.status !== 'dismissed')
  const highConfidence = visible.filter((opportunity) => opportunity.confidence === 'high')
  const pursued = all.filter((opportunity) => opportunity.status === 'pursued')

  return {
    total: visible.length,
    highConfidence: highConfidence.length,
    pursued: pursued.length,
    dismissed: all.filter((opportunity) => opportunity.status === 'dismissed').length,
    estimatedPipeline: visible.reduce((total, opportunity) => total + opportunity.estimatedValue, 0),
    averageMatchScore: visible.length ? Math.round(visible.reduce((total, opportunity) => total + opportunity.matchScore, 0) / visible.length) : 0,
  }
}
