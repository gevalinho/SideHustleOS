import { NextResponse } from 'next/server'

import { aiAssistTask, completeTask, getTaskMetrics, listTasks } from '@/lib/tasks-store'
import { getRequestAuth } from '@/lib/request-auth'

type RouteContext = {
  params: Promise<{
    path?: string[]
  }>
}

function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init)
}

function accepted(data: unknown) {
  return ok(data, { status: 202 })
}

function error(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

function requireAuth(request: Request) {
  const auth = getRequestAuth(request)

  if (!auth) {
    return { response: error(401, 'UNAUTHORIZED', 'A valid login session is required.') }
  }

  return { auth }
}

function list(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const status = new URL(request.url).searchParams.get('status') ?? undefined

  return ok({
    items: listTasks(required.auth.user.id, status),
  })
}

function metrics(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok(getTaskMetrics(required.auth.user.id))
}

function complete(request: Request, taskId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const task = completeTask(required.auth.user.id, taskId)

  if (!task) {
    return error(404, 'TASK_NOT_FOUND', 'Task was not found.')
  }

  return accepted(task)
}

function aiAssist(request: Request, taskId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const task = aiAssistTask(required.auth.user.id, taskId)

  if (!task) {
    return error(404, 'TASK_NOT_FOUND', 'Task was not found.')
  }

  return accepted(task)
}

function aiNextAction(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const tasks = listTasks(required.auth.user.id, 'pending')
  const task = tasks.find((item) => item.priority === 'high') ?? tasks[0] ?? null

  return ok(
    task
      ? {
          taskId: task.id,
          action: task.aiAssisted ? 'complete_task' : 'ai_assist_task',
          title: task.aiAssisted ? `Complete ${task.title}` : `Ask AI to assist ${task.title}`,
          rationale: task.priority === 'high' ? 'This is the highest-priority pending task.' : 'This is the next pending task by due date.',
        }
      : null,
  )
}

async function handle(request: Request, context: RouteContext) {
  const { path = [] } = await context.params

  if (request.method === 'GET' && path.length === 0) return list(request)
  if (request.method === 'GET' && path[0] === 'metrics') return metrics(request)
  if (request.method === 'GET' && path[0] === 'ai-next-action') return aiNextAction(request)

  const [taskId, action] = path

  if (request.method === 'POST' && action === 'complete') return complete(request, taskId)
  if (request.method === 'POST' && action === 'ai-assist') return aiAssist(request, taskId)

  return error(404, 'NOT_FOUND', `Tasks endpoint ${request.method} /tasks/${path.join('/')} was not found.`)
}

export const GET = handle
export const POST = handle
