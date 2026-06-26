import { randomUUID } from 'crypto'

import { listPendingApprovals } from '@/lib/agents-store'
import { listInvoices } from '@/lib/earnings-store'
import { listHustles } from '@/lib/hustles-store'

export type TaskStatus = 'pending' | 'completed' | 'blocked'
export type TaskPriority = 'high' | 'medium' | 'low'

export type Task = {
  id: string
  userId: string
  hustleId: string | null
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  source: 'hustle' | 'agent_approval' | 'invoice'
  aiAssisted: boolean
  aiSuggestion: string | null
  dueAt: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

type TasksStore = {
  tasks: Map<string, Task>
}

const globalForTasks = globalThis as typeof globalThis & {
  sideHustleOsTasksStore?: TasksStore
}

export const tasksStore =
  globalForTasks.sideHustleOsTasksStore ??
  (globalForTasks.sideHustleOsTasksStore = {
    tasks: new Map<string, Task>(),
  })

function now() {
  return new Date().toISOString()
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

function createSeedTask(userId: string, input: Omit<Task, 'id' | 'userId' | 'status' | 'aiAssisted' | 'aiSuggestion' | 'completedAt' | 'createdAt' | 'updatedAt'>) {
  const timestamp = now()
  const task: Task = {
    id: randomUUID(),
    userId,
    status: 'pending',
    aiAssisted: false,
    aiSuggestion: null,
    completedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...input,
  }

  tasksStore.tasks.set(task.id, task)

  return task
}

export function seedTasksForUser(userId: string) {
  const hustles = listHustles(userId)
  const approvals = listPendingApprovals(userId)
  const invoices = listInvoices(userId, 'outstanding')

  for (const hustle of hustles) {
    const existingForHustle = [...tasksStore.tasks.values()].some((task) => task.userId === userId && task.hustleId === hustle.id && task.source === 'hustle')

    if (!existingForHustle) {
      createSeedTask(userId, {
        hustleId: hustle.id,
        title: `Review next action for ${hustle.name}`,
        description: `${hustle.openTasks} operating tasks are open for this hustle.`,
        priority: 'high',
        source: 'hustle',
        dueAt: hoursFromNow(4),
      })
      createSeedTask(userId, {
        hustleId: hustle.id,
        title: `Prepare outreach list for ${hustle.name}`,
        description: 'Build the next qualified prospect batch before running outreach.',
        priority: 'medium',
        source: 'hustle',
        dueAt: hoursFromNow(24),
      })
    }
  }

  for (const approval of approvals) {
    const existingForApproval = [...tasksStore.tasks.values()].some((task) => task.userId === userId && task.description.includes(approval.id))

    if (!existingForApproval) {
      createSeedTask(userId, {
        hustleId: approval.hustleId,
        title: 'Approve AI-generated draft',
        description: `Review pending approval ${approval.id}`,
        priority: 'high',
        source: 'agent_approval',
        dueAt: hoursFromNow(2),
      })
    }
  }

  for (const invoice of invoices) {
    const existingForInvoice = [...tasksStore.tasks.values()].some((task) => task.userId === userId && task.description.includes(invoice.id))

    if (!existingForInvoice) {
      createSeedTask(userId, {
        hustleId: invoice.hustleId,
        title: `Follow up on ${invoice.description}`,
        description: `Outstanding invoice ${invoice.id}`,
        priority: 'medium',
        source: 'invoice',
        dueAt: hoursFromNow(18),
      })
    }
  }
}

export function listTasks(userId: string, status?: string) {
  seedTasksForUser(userId)

  return [...tasksStore.tasks.values()]
    .filter((task) => task.userId === userId)
    .filter((task) => (status ? task.status === status : true))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
}

export function getTask(userId: string, taskId: string) {
  seedTasksForUser(userId)

  const task = tasksStore.tasks.get(taskId)

  if (!task || task.userId !== userId) {
    return null
  }

  return task
}

export function completeTask(userId: string, taskId: string) {
  const task = getTask(userId, taskId)

  if (!task) {
    return null
  }

  const updated: Task = {
    ...task,
    status: 'completed',
    completedAt: now(),
    updatedAt: now(),
  }

  tasksStore.tasks.set(updated.id, updated)

  return updated
}

export function aiAssistTask(userId: string, taskId: string) {
  const task = getTask(userId, taskId)

  if (!task) {
    return null
  }

  const suggestion =
    task.source === 'agent_approval'
      ? 'Review tone, claim specificity, and call-to-action before approving the draft.'
      : task.source === 'invoice'
        ? 'Send a concise payment reminder with invoice context and a direct payment link.'
        : 'Break the work into one approval, one outbound action, and one measurable follow-up.'

  const updated: Task = {
    ...task,
    aiAssisted: true,
    aiSuggestion: suggestion,
    updatedAt: now(),
  }

  tasksStore.tasks.set(updated.id, updated)

  return updated
}

export function getTaskMetrics(userId: string) {
  const tasks = listTasks(userId)
  const pending = tasks.filter((task) => task.status === 'pending')

  return {
    total: tasks.length,
    pending: pending.length,
    completed: tasks.filter((task) => task.status === 'completed').length,
    blocked: tasks.filter((task) => task.status === 'blocked').length,
    dueToday: pending.filter((task) => new Date(task.dueAt).toDateString() === new Date().toDateString()).length,
    aiAssisted: tasks.filter((task) => task.aiAssisted || task.source === 'agent_approval').length,
    highPriority: pending.filter((task) => task.priority === 'high').length,
  }
}
