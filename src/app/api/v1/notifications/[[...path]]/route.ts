import { NextResponse } from 'next/server'

import { getUnreadNotificationCount, listNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/notifications-store'
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

  const unreadOnly = new URL(request.url).searchParams.get('unread') === 'true'

  return ok({
    items: listNotifications(required.auth.user.id, unreadOnly),
  })
}

function unreadCount(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok({
    unreadCount: getUnreadNotificationCount(required.auth.user.id),
  })
}

function markOneRead(request: Request, notificationId: string) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const notification = markNotificationRead(required.auth.user.id, notificationId)

  if (!notification) {
    return error(404, 'NOTIFICATION_NOT_FOUND', 'Notification was not found.')
  }

  return accepted(notification)
}

function markAllRead(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return accepted(markAllNotificationsRead(required.auth.user.id))
}

async function handle(request: Request, context: RouteContext) {
  const { path = [] } = await context.params

  if (request.method === 'GET' && path.length === 0) return list(request)
  if (request.method === 'GET' && path[0] === 'unread-count') return unreadCount(request)
  if (request.method === 'POST' && path[0] === 'read-all') return markAllRead(request)

  const [notificationId, action] = path

  if (request.method === 'POST' && action === 'read') return markOneRead(request, notificationId)

  return error(404, 'NOT_FOUND', `Notifications endpoint ${request.method} /notifications/${path.join('/')} was not found.`)
}

export const GET = handle
export const POST = handle
