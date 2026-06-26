import { getAgentMetrics, getAgentPerformance, listAgents } from '@/lib/agents-store'
import { getEarningsMetrics, listEarnings } from '@/lib/earnings-store'
import { getHustleMetrics, getHustlePerformance, listHustles } from '@/lib/hustles-store'
import { getOpportunityMetrics } from '@/lib/opportunities-store'
import { getTaskMetrics } from '@/lib/tasks-store'

function clampDays(value: unknown, fallback = 30) {
  const days = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(days) ? Math.min(Math.max(Math.round(days), 1), 90) : fallback
}

function percent(value: number) {
  return Number(value.toFixed(2))
}

export function getAnalyticsSummary(userId: string) {
  const hustleMetrics = getHustleMetrics(userId)
  const earningsMetrics = getEarningsMetrics(userId)
  const agentMetrics = getAgentMetrics(userId)
  const taskMetrics = getTaskMetrics(userId)
  const opportunityMetrics = getOpportunityMetrics(userId)

  return {
    revenue: {
      collected: earningsMetrics.collected,
      outstanding: earningsMetrics.outstanding,
      overdue: earningsMetrics.overdue,
      growthPercent: hustleMetrics.averageGrowthPercent,
    },
    operations: {
      activeHustles: hustleMetrics.active,
      runningAgents: agentMetrics.running,
      pendingTasks: taskMetrics.pending,
      highConfidenceOpportunities: opportunityMetrics.highConfidence,
    },
    funnel: {
      prospects: Math.max(opportunityMetrics.total * 25, 0),
      contacted: Math.max(agentMetrics.runsToday * 3, 0),
      replies: Math.max(Math.round(agentMetrics.runsToday * agentMetrics.averageSuccessRate), 0),
      wins: earningsMetrics.paidInvoices,
    },
  }
}

export function getRevenueAnalytics(userId: string, input: { days?: unknown; granularity?: string }) {
  const days = clampDays(input.days)
  const granularity = input.granularity === 'week' ? 'week' : 'day'
  const hustles = listHustles(userId)
  const earnings = listEarnings(userId)
  const primaryHustle = hustles[0] ?? null
  const baseSeries = primaryHustle ? getHustlePerformance(primaryHustle, days) : []
  const collected = earnings.reduce((total, earning) => total + earning.amount, 0)
  const dailyCollected = collected / Math.max(days, 1)
  const daily = Array.from({ length: days }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - index - 1))

    return {
      date: date.toISOString().slice(0, 10),
      revenue: Math.round((baseSeries[index]?.revenue ?? dailyCollected) * (0.85 + index / Math.max(days * 6, 1))),
      collected: Math.round(dailyCollected * (index + 1)),
    }
  })

  if (granularity === 'day') {
    return {
      days,
      granularity,
      series: daily,
    }
  }

  const weekly = daily.reduce<Array<{ date: string; revenue: number; collected: number }>>((groups, point, index) => {
    if (index % 7 === 0) {
      groups.push({ date: point.date, revenue: 0, collected: 0 })
    }

    const current = groups[groups.length - 1]
    current.revenue += point.revenue
    current.collected = point.collected

    return groups
  }, [])

  return {
    days,
    granularity,
    series: weekly,
  }
}

export function getOutreachAnalytics(userId: string) {
  const agentMetrics = getAgentMetrics(userId)
  const opportunityMetrics = getOpportunityMetrics(userId)
  const prospects = Math.max(opportunityMetrics.total * 25, 1)
  const contacted = Math.min(Math.max(agentMetrics.runsToday * 3, 0), prospects)
  const replies = Math.min(Math.round(contacted * Math.max(agentMetrics.averageSuccessRate, 0.1)), contacted)
  const qualified = Math.min(Math.round(replies * 0.6), replies)
  const won = getEarningsMetrics(userId).paidInvoices

  return {
    stages: [
      { name: 'Prospects', count: prospects, conversionRate: 100 },
      { name: 'Contacted', count: contacted, conversionRate: percent((contacted / prospects) * 100) },
      { name: 'Replies', count: replies, conversionRate: percent((replies / prospects) * 100) },
      { name: 'Qualified', count: qualified, conversionRate: percent((qualified / prospects) * 100) },
      { name: 'Won', count: won, conversionRate: percent((won / prospects) * 100) },
    ],
    replyRate: percent((replies / Math.max(contacted, 1)) * 100),
    winRate: percent((won / Math.max(qualified, 1)) * 100),
  }
}

export function getAgentAnalytics(userId: string) {
  const agents = listAgents(userId)
  const performance = getAgentPerformance(userId)

  return {
    items: performance.map((item) => {
      const agent = agents.find((candidate) => candidate.id === item.agentId)

      return {
        ...item,
        type: agent?.type ?? 'unknown',
        status: agent?.status ?? 'idle',
      }
    }),
  }
}
