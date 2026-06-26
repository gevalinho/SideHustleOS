'use server'

import { revalidatePath } from 'next/cache'

import { markAllNotificationsRead, markNotificationRead } from '@/lib/notifications-store'
import { requireCompletedOnboarding } from '@/lib/session'

function formString(formData: FormData, name: string) {
  const value = formData.get(name)

  return typeof value === 'string' ? value.trim() : ''
}

export async function markNotificationReadAction(formData: FormData) {
  const accountSession = await requireCompletedOnboarding('/')
  const notificationId = formString(formData, 'notificationId')

  if (!notificationId) {
    return
  }

  markNotificationRead(accountSession.user.id, notificationId)
  revalidatePath('/')
  revalidatePath('/tasks')
  revalidatePath('/ai-agents')
  revalidatePath('/earnings')
  revalidatePath('/opportunities')
}

export async function markAllNotificationsReadAction() {
  const accountSession = await requireCompletedOnboarding('/')

  markAllNotificationsRead(accountSession.user.id)
  revalidatePath('/')
  revalidatePath('/tasks')
  revalidatePath('/ai-agents')
  revalidatePath('/earnings')
  revalidatePath('/opportunities')
}
