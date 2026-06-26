import { randomUUID } from 'crypto'

import { getAgentMetrics } from '@/lib/agents-store'
import { getEarningsMetrics } from '@/lib/earnings-store'
import { getOpportunityMetrics } from '@/lib/opportunities-store'
import { getTaskMetrics } from '@/lib/tasks-store'

export type NotificationType = 'task' | 'approval' | 'earning' | 'opportunity' | 'system'

export type Notification = {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  href: string
  readAt: string | null
  createdAt: string
}

type NotificationsStore = {
  notifications: Map<string, Notification>
}

const globalForNotifications = globalThis as typeof globalThis & {
  sideHustleOsNotificationsStore?: NotificationsStore
}

export const notificationsStore =
  globalForNotifications.sideHustleOsNotificationsStore ??
  (globalForNotifications.sideHustleOsNotificationsStore = {
    notifications: new Map<string, Notification>(),
  })

function now() {
  return new Date().toISOString()
}

function createNotification(userId: string, input: Omit<Notification, 'id' | 'userId' | 'readAt' | 'createdAt'>) {
  const notification: Notification = {
    id: randomUUID(),
    userId,
    readAt: null,
    createdAt: now(),
    ...input,
  }

  notificationsStore.notifications.set(notification.id, notification)

  return notification
}

export function seedNotificationsForUser(userId: string) {
  const existing = [...notificationsStore.notifications.values()].some((notification) => notification.userId === userId)

  if (existing) {
    return
  }

  const taskMetrics = getTaskMetrics(userId)
  const agentMetrics = getAgentMetrics(userId)
  const earningsMetrics = getEarningsMetrics(userId)
  const opportunityMetrics = getOpportunityMetrics(userId)

  if (taskMetrics.pending) {
    createNotification(userId, {
      type: 'task',
      title: `${taskMetrics.pending} tasks need attention`,
      body: `${taskMetrics.highPriority} high-priority tasks are waiting in your queue.`,
      href: '/tasks',
    })
  }

  if (agentMetrics.approvalsPending) {
    createNotification(userId, {
      type: 'approval',
      title: `${agentMetrics.approvalsPending} AI approvals pending`,
      body: 'Review pending drafts before agents continue customer-facing work.',
      href: '/ai-agents',
    })
  }

  if (earningsMetrics.outstandingInvoices) {
    createNotification(userId, {
      type: 'earning',
      title: `${earningsMetrics.outstandingInvoices} invoices awaiting payment`,
      body: `$${Math.round(earningsMetrics.outstanding).toLocaleString('en-US')} is still outstanding.`,
      href: '/earnings',
    })
  }

  if (opportunityMetrics.highConfidence) {
    createNotification(userId, {
      type: 'opportunity',
      title: `${opportunityMetrics.highConfidence} high-confidence opportunities`,
      body: `$${Math.round(opportunityMetrics.estimatedPipeline).toLocaleString('en-US')} estimated pipeline is available.`,
      href: '/opportunities',
    })
  }

  if (!taskMetrics.pending && !agentMetrics.approvalsPending && !earningsMetrics.outstandingInvoices && !opportunityMetrics.highConfidence) {
    createNotification(userId, {
      type: 'system',
      title: 'Workspace is up to date',
      body: 'No urgent operating items need attention right now.',
      href: '/',
    })
  }
}

export function listNotifications(userId: string, unreadOnly = false) {
  seedNotificationsForUser(userId)

  return [...notificationsStore.notifications.values()]
    .filter((notification) => notification.userId === userId)
    .filter((notification) => (unreadOnly ? !notification.readAt : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getUnreadNotificationCount(userId: string) {
  return listNotifications(userId, true).length
}

export function markNotificationRead(userId: string, notificationId: string) {
  const notification = notificationsStore.notifications.get(notificationId)

  if (!notification || notification.userId !== userId) {
    return null
  }

  const updated: Notification = {
    ...notification,
    readAt: notification.readAt ?? now(),
  }

  notificationsStore.notifications.set(updated.id, updated)

  return updated
}

export function markAllNotificationsRead(userId: string) {
  const notifications = listNotifications(userId)
  const timestamp = now()

  for (const notification of notifications) {
    notificationsStore.notifications.set(notification.id, {
      ...notification,
      readAt: notification.readAt ?? timestamp,
    })
  }

  return {
    updated: notifications.filter((notification) => !notification.readAt).length,
    unreadCount: 0,
  }
}
