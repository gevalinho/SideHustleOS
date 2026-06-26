import { randomUUID } from 'crypto'

import { authStore, updateUser } from '@/lib/auth-store'
import type { PublicUser } from '@/lib/auth-store'

export type BillingPlan = PublicUser['plan']

export type PricingPlan = {
  id: BillingPlan
  name: string
  price: number
  interval: 'month' | 'usage'
  includedProspects: number
  includedEmails: number
  maxHustles: number | 'unlimited'
  maxAgents: number | 'unlimited'
  features: string[]
}

export type TopUpKey = 'prospect_batch_50' | 'prospect_batch_150' | 'email_credits_500' | 'onboarding_vip'

export type TopUp = {
  key: TopUpKey
  name: string
  price: number
  credits: {
    prospects?: number
    emails?: number
    vipOnboarding?: boolean
  }
}

export type BillingPurchase = {
  id: string
  userId: string
  type: 'plan_upgrade' | 'top_up'
  description: string
  amount: number
  currency: 'USD'
  createdAt: string
}

export type BillingAccount = {
  userId: string
  plan: BillingPlan
  prospectCredits: number
  emailCredits: number
  vipOnboarding: boolean
  purchases: BillingPurchase[]
  createdAt: string
  updatedAt: string
}

type BillingStore = {
  accounts: Map<string, BillingAccount>
}

const globalForBilling = globalThis as typeof globalThis & {
  sideHustleOsBillingStore?: BillingStore
}

export const billingStore =
  globalForBilling.sideHustleOsBillingStore ??
  (globalForBilling.sideHustleOsBillingStore = {
    accounts: new Map<string, BillingAccount>(),
  })

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    includedProspects: 25,
    includedEmails: 50,
    maxHustles: 1,
    maxAgents: 2,
    features: ['One hustle', 'Manual approvals', 'Basic analytics'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    interval: 'month',
    includedProspects: 250,
    includedEmails: 500,
    maxHustles: 3,
    maxAgents: 7,
    features: ['Three hustles', 'AI outreach drafts', 'Invoice and chaser tools'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    interval: 'month',
    includedProspects: 1000,
    includedEmails: 2500,
    maxHustles: 'unlimited',
    maxAgents: 'unlimited',
    features: ['Unlimited hustles', 'Advanced agents', 'Revenue analytics'],
  },
  {
    id: 'revenue_share',
    name: 'Revenue Share',
    price: 0,
    interval: 'usage',
    includedProspects: 150,
    includedEmails: 300,
    maxHustles: 2,
    maxAgents: 5,
    features: ['Lower monthly cost', 'Success-based platform fee', 'Human approval workflow'],
  },
]

export const topUps: TopUp[] = [
  { key: 'prospect_batch_50', name: '50 prospects', price: 9, credits: { prospects: 50 } },
  { key: 'prospect_batch_150', name: '150 prospects', price: 24, credits: { prospects: 150 } },
  { key: 'email_credits_500', name: '500 emails', price: 15, credits: { emails: 500 } },
  { key: 'onboarding_vip', name: 'VIP onboarding', price: 49, credits: { vipOnboarding: true } },
]

function now() {
  return new Date().toISOString()
}

function getUserPlan(userId: string): BillingPlan {
  return authStore.users.get(userId)?.plan ?? 'free'
}

export function getPricing() {
  return {
    currency: 'USD',
    plans: pricingPlans,
    topUps,
  }
}

export function getBillingAccount(userId: string) {
  const existing = billingStore.accounts.get(userId)
  const userPlan = getUserPlan(userId)

  if (existing) {
    if (existing.plan === userPlan) {
      return existing
    }

    const synced: BillingAccount = {
      ...existing,
      plan: userPlan,
      updatedAt: now(),
    }

    billingStore.accounts.set(userId, synced)

    return synced
  }

  const timestamp = now()
  const account: BillingAccount = {
    userId,
    plan: userPlan,
    prospectCredits: 0,
    emailCredits: 0,
    vipOnboarding: false,
    purchases: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  billingStore.accounts.set(userId, account)

  return account
}

export function getBillingStatus(userId: string) {
  const account = getBillingAccount(userId)
  const plan = pricingPlans.find((item) => item.id === account.plan) ?? pricingPlans[0]

  return {
    account,
    plan,
    included: {
      prospects: plan.includedProspects + account.prospectCredits,
      emails: plan.includedEmails + account.emailCredits,
      maxHustles: plan.maxHustles,
      maxAgents: plan.maxAgents,
    },
  }
}

export function upgradeBillingPlan(userId: string, plan: BillingPlan) {
  const pricingPlan = pricingPlans.find((item) => item.id === plan)

  if (!pricingPlan) {
    return null
  }

  const user = authStore.users.get(userId)

  if (!user) {
    return null
  }

  updateUser(user, { plan })

  const account = getBillingAccount(userId)
  const purchase = createPurchase(userId, {
    type: 'plan_upgrade',
    description: `Switched to ${pricingPlan.name}`,
    amount: pricingPlan.price,
  })
  const updated: BillingAccount = {
    ...account,
    plan,
    purchases: [purchase, ...account.purchases],
    updatedAt: now(),
  }

  billingStore.accounts.set(userId, updated)

  return getBillingStatus(userId)
}

export function applyTopUp(userId: string, topUpKey: string) {
  const topUp = topUps.find((item) => item.key === topUpKey)

  if (!topUp) {
    return null
  }

  const account = getBillingAccount(userId)
  const purchase = createPurchase(userId, {
    type: 'top_up',
    description: topUp.name,
    amount: topUp.price,
  })
  const updated: BillingAccount = {
    ...account,
    prospectCredits: account.prospectCredits + (topUp.credits.prospects ?? 0),
    emailCredits: account.emailCredits + (topUp.credits.emails ?? 0),
    vipOnboarding: account.vipOnboarding || Boolean(topUp.credits.vipOnboarding),
    purchases: [purchase, ...account.purchases],
    updatedAt: now(),
  }

  billingStore.accounts.set(userId, updated)

  return getBillingStatus(userId)
}

function createPurchase(userId: string, input: Omit<BillingPurchase, 'id' | 'userId' | 'currency' | 'createdAt'>) {
  return {
    id: randomUUID(),
    userId,
    currency: 'USD' as const,
    createdAt: now(),
    ...input,
  }
}
