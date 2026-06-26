import { NextResponse } from 'next/server'

import { getSystemHealth } from '@/lib/system-health'

export function GET() {
  const health = getSystemHealth()

  return NextResponse.json(
    {
      success: true,
      data: health,
    },
    {
      status: health.status === 'ok' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}
