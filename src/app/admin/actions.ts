'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/admin-session'
import { createBroadcast, overrideDispute, setAdminUserStatus, setUserPlan } from '@/lib/admin-store'
import type { AdminDispute, AdminUserStatus } from '@/lib/admin-store'
import type { PublicUser } from '@/lib/auth-store'

const userStatuses: AdminUserStatus[] = ['active', 'suspended', 'banned']
const plans: PublicUser['plan'][] = ['free', 'starter', 'pro', 'revenue_share']
const disputeWinners: NonNullable<AdminDispute['winner']>[] = ['client', 'freelancer', 'split']

function formString(formData: FormData, name: string) {
  const value = formData.get(name)

  return typeof value === 'string' ? value.trim() : ''
}

export async function updateAdminUserStatus(formData: FormData) {
  await requireAdminSession('/admin')

  const userId = formString(formData, 'userId')
  const status = formString(formData, 'status') as AdminUserStatus
  const reason = formString(formData, 'reason')

  if (!userId || !userStatuses.includes(status) || !reason) {
    return
  }

  setAdminUserStatus(userId, { status, reason })
  revalidatePath('/admin')
}

export async function updateAdminUserPlan(formData: FormData) {
  await requireAdminSession('/admin')

  const userId = formString(formData, 'userId')
  const plan = formString(formData, 'plan') as PublicUser['plan']

  if (!userId || !plans.includes(plan)) {
    return
  }

  setUserPlan(userId, plan)
  revalidatePath('/admin')
}

export async function createAdminBroadcast(formData: FormData) {
  await requireAdminSession('/admin')

  const title = formString(formData, 'title')
  const body = formString(formData, 'body')
  const audience = formString(formData, 'audience')

  if (!title || !body || (audience !== 'all' && audience !== 'paid')) {
    return
  }

  createBroadcast({ title, body, audience })
  revalidatePath('/admin')
}

export async function overrideAdminDispute(formData: FormData) {
  await requireAdminSession('/admin')

  const disputeId = formString(formData, 'disputeId')
  const winner = formString(formData, 'winner') as NonNullable<AdminDispute['winner']>
  const adminReason = formString(formData, 'adminReason')
  const splitPercentValue = Number(formString(formData, 'splitPercent') || 50)
  const splitPercent = Number.isFinite(splitPercentValue) ? Math.min(Math.max(splitPercentValue, 1), 99) : 50

  if (!disputeId || !disputeWinners.includes(winner) || !adminReason) {
    return
  }

  overrideDispute(disputeId, {
    winner,
    splitPercent,
    adminReason,
  })
  revalidatePath('/admin')
}
