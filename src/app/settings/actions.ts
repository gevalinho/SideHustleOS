'use server'

import { revalidatePath } from 'next/cache'

import { applyTopUp, upgradeBillingPlan } from '@/lib/billing-store'
import { authStore, revokeUserSessions, updateUser } from '@/lib/auth-store'
import { requireCompletedOnboarding } from '@/lib/session'
import { updateAgentLimits, updateApprovalRules } from '@/lib/settings-store'
import type { ApprovalMode } from '@/lib/settings-store'
import type { BillingPlan, TopUpKey } from '@/lib/billing-store'

const approvalModes: ApprovalMode[] = ['manual', 'balanced', 'autopilot']
const billingPlans: BillingPlan[] = ['starter', 'pro', 'revenue_share']
const topUpKeys: TopUpKey[] = ['prospect_batch_50', 'prospect_batch_150', 'email_credits_500', 'onboarding_vip']

function formString(formData: FormData, name: string) {
  const value = formData.get(name)

  return typeof value === 'string' ? value.trim() : ''
}

function formNumber(formData: FormData, name: string) {
  const value = Number(formString(formData, name))

  return Number.isFinite(value) ? value : undefined
}

export async function updateProfile(formData: FormData) {
  const accountSession = await requireCompletedOnboarding('/settings')
  const name = formString(formData, 'name')
  const user = authStore.users.get(accountSession.user.id)

  if (!user || !name) {
    return
  }

  updateUser(user, { name })
  revalidatePath('/settings')
}

export async function saveApprovalRules(formData: FormData) {
  const accountSession = await requireCompletedOnboarding('/settings')
  const mode = formString(formData, 'mode') as ApprovalMode
  const requireApprovalFor = formData
    .getAll('requireApprovalFor')
    .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))

  if (!approvalModes.includes(mode)) {
    return
  }

  updateApprovalRules(accountSession.user.id, {
    mode,
    requireApprovalFor,
    activeRuleCount: requireApprovalFor.length,
  })
  revalidatePath('/settings')
}

export async function saveAgentLimits(formData: FormData) {
  const accountSession = await requireCompletedOnboarding('/settings')

  updateAgentLimits(accountSession.user.id, {
    dailyEmailCap: formNumber(formData, 'dailyEmailCap'),
    monthlyAdSpendCap: formNumber(formData, 'monthlyAdSpendCap'),
    maxConcurrentAgents: formNumber(formData, 'maxConcurrentAgents'),
  })
  revalidatePath('/settings')
}

export async function changeBillingPlan(formData: FormData) {
  const accountSession = await requireCompletedOnboarding('/settings')
  const plan = formString(formData, 'plan') as BillingPlan

  if (!billingPlans.includes(plan)) {
    return
  }

  upgradeBillingPlan(accountSession.user.id, plan)
  revalidatePath('/settings')
}

export async function purchaseTopUp(formData: FormData) {
  const accountSession = await requireCompletedOnboarding('/settings')
  const topUpKey = formString(formData, 'topUpKey') as TopUpKey

  if (!topUpKeys.includes(topUpKey)) {
    return
  }

  applyTopUp(accountSession.user.id, topUpKey)
  revalidatePath('/settings')
}

export async function revokeOtherSessions() {
  const accountSession = await requireCompletedOnboarding('/settings')

  revokeUserSessions(accountSession.user.id, accountSession.session.id)
  revalidatePath('/settings')
}
