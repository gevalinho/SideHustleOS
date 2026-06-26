import type { DashboardHomeData } from '@/components/dashboard/home-page'
import type { DashboardMenuData } from '@/components/dashboard/shell'
import { getAgentMetrics, getAgentPerformance, listAgents } from '@/lib/agents-store'
import { getEarningsMetrics, listEarnings, listInvoices } from '@/lib/earnings-store'
import { getHustleMetrics, getHustlePerformance, listHustles } from '@/lib/hustles-store'

function currency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function percent(value: number) {
  return `${value.toFixed(1)}%`
}

function sparklineFrom(values: number[]) {
  if (values.length >= 2) {
    return values
  }

  return [1, 2, 3, 4, 5, 6, 7]
}

function barsFrom(values: number[]) {
  const max = Math.max(...values, 1)

  return values.slice(-7).map((value) => Math.max(Math.round((value / max) * 86), 12))
}

function formatDateRange(start: Date, end: Date) {
  const sameYear = start.getFullYear() === end.getFullYear()
  const startFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: sameYear ? undefined : 'numeric' })
  const endFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return `${startFormat.format(start)} - ${endFormat.format(end)}`
}

function currentWeekRange() {
  const today = new Date()
  const start = new Date(today)
  const day = today.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day

  start.setDate(today.getDate() + mondayOffset)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return formatDateRange(start, end)
}

export function getDashboardMenuData(userId: string, plan: string): DashboardMenuData {
  const hustleMetrics = getHustleMetrics(userId)
  const agentMetrics = getAgentMetrics(userId)
  const earningsMetrics = getEarningsMetrics(userId)
  const isFreePlan = plan === 'free'

  return {
    dateRange: currentWeekRange(),
    navBadges: {
      hustles: String(hustleMetrics.active),
      agents: String(agentMetrics.running),
      tasks: String(hustleMetrics.openTasks + agentMetrics.approvalsPending),
      earnings: currency(earningsMetrics.collected),
      opportunities: String(Math.min(Math.max(hustleMetrics.active * 3, 0), 99)),
      settings: plan.replaceAll('_', ' '),
    },
    planPanel: {
      title: isFreePlan ? 'Free Plan' : `${plan.replaceAll('_', ' ').replace(/^\w/, (letter) => letter.toUpperCase())} Plan`,
      description: isFreePlan
        ? `${agentMetrics.running} agents running. Upgrade when you need higher outreach volume.`
        : `${agentMetrics.running} agents running with ${agentMetrics.approvalsPending} approval${agentMetrics.approvalsPending === 1 ? '' : 's'} pending.`,
      actionLabel: isFreePlan ? 'View Plans' : 'Manage Plan',
      href: isFreePlan ? '/pricing' : '/settings',
    },
  }
}

export function getDashboardHomeData(userId: string, plan = 'free'): DashboardHomeData {
  const hustles = listHustles(userId)
  const metrics = getHustleMetrics(userId)
  const agents = listAgents(userId)
  const agentMetrics = getAgentMetrics(userId)
  const earningsMetrics = getEarningsMetrics(userId)
  const earnings = listEarnings(userId)
  const topHustle = [...hustles].sort((a, b) => b.currentRevenue - a.currentRevenue)[0] ?? null
  const performance = topHustle ? getHustlePerformance(topHustle, 21) : []
  const revenueSeries = sparklineFrom(performance.map((point) => point.revenue))
  const repliesSeries = sparklineFrom(performance.map((point) => point.replies))
  const totalRevenue = Math.max(metrics.totalRevenue, 0)

  return {
    menu: getDashboardMenuData(userId, plan),
    stats: [
      {
        label: 'Total Revenue',
        value: currency(earningsMetrics.collected),
        delta: `${percent(metrics.averageGrowthPercent)} avg growth`,
        icon: 'revenue',
        color: 'olive',
        data: revenueSeries,
      },
      {
        label: 'Active Hustles',
        value: String(metrics.active),
        delta: `${metrics.total} total`,
        icon: 'hustles',
        color: 'olive',
        data: hustles.map((_, index) => index + 1).concat([metrics.active || 1]),
      },
      {
        label: 'AI Automations',
        value: String(agentMetrics.running),
        delta: `${agentMetrics.runsToday} runs today`,
        icon: 'agents',
        color: 'olive',
        data: sparklineFrom(agents.map((agent) => agent.runsToday)),
      },
      {
        label: 'Weekly Growth',
        value: `+${percent(metrics.averageGrowthPercent)}`,
        delta: 'from active hustles',
        icon: 'growth',
        color: 'olive',
        data: repliesSeries,
      },
    ],
    recommendations: [
      {
        title: topHustle ? `Find prospects for ${topHustle.name}` : 'Create your first hustle',
        detail: topHustle ? `${topHustle.openTasks} open tasks need momentum` : 'Complete onboarding to seed one',
        action: topHustle ? 'Run agent' : 'Start',
        icon: 'rocket',
        color: 'olive',
      },
      {
        title: topHustle ? `Close gap to ${currency(topHustle.targetRevenue)}` : 'Set a revenue target',
        detail: topHustle ? `${currency(Math.max(topHustle.targetRevenue - topHustle.currentRevenue, 0))} remaining target` : 'Give agents a clear outcome',
        action: 'View Insight',
        icon: 'banknotes',
        color: 'olive',
      },
      {
        title: 'Turn activity into outreach',
        detail: `${agentMetrics.approvalsPending} approvals pending`,
        action: 'Draft',
        icon: 'bolt',
        color: 'olive',
      },
    ],
    priorities: hustles.slice(0, 4).map((hustle, index) => ({
      task: index === 0 ? `Review next action for ${hustle.name}` : `Advance ${hustle.name}`,
      time: ['10:00 AM', '1:00 PM', '3:30 PM', '5:00 PM'][index] ?? 'Today',
      done: index === 0 && hustle.currentRevenue > 0,
    })),
    transactions: earnings.slice(0, 4).map((earning) => ({
      name: earning.description,
      meta: new Date(earning.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      amount: `+ ${currency(earning.amount)}`,
      color: 'olive',
    })),
    agents: agents.slice(0, 4).map((agent, index) => ({
      name: agent.name,
      detail: `${agent.status} - ${agent.runsToday} runs today`,
      time: agent.lastRunAt ? new Date(agent.lastRunAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Not run yet',
      icon: (['target', 'star', 'document', 'inbox'][index] ?? 'target') as DashboardHomeData['agents'][number]['icon'],
      color: 'olive',
    })),
    opportunities: hustles.slice(0, 3).map((hustle, index) => ({
      title: ['High-fit prospects', 'Retainer upsell', 'Offer optimization'][index] ?? 'Growth opportunity',
      detail: `${hustle.name}\n${currency(Math.round(hustle.targetRevenue * 0.2))} potential`,
      match: `${Math.max(98 - index * 7, 75)}% Match`,
      icon: (['briefcase', 'document', 'chart'][index] ?? 'briefcase') as DashboardHomeData['opportunities'][number]['icon'],
    })),
    topHustle: topHustle
      ? {
          name: topHustle.name,
          currentRevenue: currency(topHustle.currentRevenue),
          growth: percent(topHustle.monthlyGrowthPercent),
          bars: barsFrom(performance.map((point) => point.revenue)),
        }
      : null,
    earningsSegments: hustles.slice(0, 4).map((hustle, index) => {
      const share = totalRevenue ? Math.round((hustle.currentRevenue / totalRevenue) * 100) : 0

      return {
        label: hustle.name,
        value: currency(hustle.currentRevenue),
        share: `${share}%`,
        color: ['bg-olive-950', 'bg-olive-500', 'bg-olive-700', 'bg-olive-300'][index] ?? 'bg-olive-500',
      }
    }),
    totalRevenue: currency(earningsMetrics.collected),
  }
}

export function getHustlesSectionData(userId: string) {
  const hustles = listHustles(userId)
  const metrics = getHustleMetrics(userId)
  const topHustle = [...hustles].sort((a, b) => b.currentRevenue - a.currentRevenue)[0] ?? null

  return {
    metrics: [
      ['Active hustles', String(metrics.active), `${metrics.total} total`],
      ['Monthly revenue', currency(metrics.totalRevenue), `${percent(metrics.averageGrowthPercent)} avg growth`],
      ['Open tasks', String(metrics.openTasks), `${metrics.activeAgents} agents active`],
    ] as [string, string, string][],
    primary: topHustle?.name ?? 'No hustle yet',
    rows: hustles.slice(0, 8).map(
      (hustle) =>
        [
          hustle.name,
          hustle.status === 'active' ? 'Active' : hustle.status,
          currency(hustle.currentRevenue),
          `${percent(hustle.monthlyGrowthPercent)} growth`,
        ] as [string, string, string, string],
    ),
  }
}

export function getAgentsSectionData(userId: string) {
  const agents = listAgents(userId)
  const metrics = getAgentMetrics(userId)
  const performance = getAgentPerformance(userId)
  const topAgent = [...agents].sort((a, b) => b.approvalsPending - a.approvalsPending || b.runsToday - a.runsToday)[0] ?? null

  return {
    metrics: [
      ['Active agents', String(metrics.running), `${metrics.runsToday} runs today`],
      ['Human approvals', String(metrics.approvalsPending), `${metrics.paused} paused`],
      ['Success rate', `${Math.round(metrics.averageSuccessRate * 100)}%`, `${metrics.total} total agents`],
    ] as [string, string, string][],
    primary: topAgent?.name ?? 'No agents yet',
    rows: agents.slice(0, 8).map((agent) => {
      const trend = performance.find((item) => item.agentId === agent.id)

      return [
        agent.name,
        `${agent.type.replaceAll('_', ' ')} - ${agent.approvalsPending} approvals`,
        agent.status === 'running' ? 'Running' : agent.status === 'paused' ? 'Paused' : 'Idle',
        trend ? `${Math.round(trend.successRate * 100)}% success, ${trend.runsToday} runs` : 'No runs yet',
      ] as [string, string, string, string]
    }),
  }
}

export function getEarningsSectionData(userId: string) {
  const metrics = getEarningsMetrics(userId)
  const invoices = listInvoices(userId)
  const feed = listEarnings(userId)
  const priorityInvoice =
    invoices.find((invoice) => invoice.status === 'overdue') ??
    invoices.find((invoice) => invoice.status === 'outstanding') ??
    invoices.find((invoice) => invoice.status === 'draft') ??
    invoices[0] ??
    null

  return {
    metrics: [
      ['Collected', currency(metrics.collected), `${metrics.paidInvoices} paid invoice${metrics.paidInvoices === 1 ? '' : 's'}`],
      ['Outstanding', currency(metrics.outstanding), `${metrics.outstandingInvoices} awaiting payment`],
      ['Overdue', currency(metrics.overdue), `${metrics.overdueInvoices} need follow-up`],
    ] as [string, string, string][],
    primary: priorityInvoice ? `${currency(priorityInvoice.amount)} ${priorityInvoice.status}` : currency(metrics.collected),
    rows: invoices.slice(0, 8).map((invoice) => {
      const paid = feed.find((earning) => earning.invoiceId === invoice.id)

      return [
        invoice.description,
        invoice.status === 'paid' ? 'Paid' : invoice.status === 'outstanding' ? 'Outstanding' : invoice.status === 'overdue' ? 'Overdue' : 'Draft',
        currency(invoice.amount),
        paid
          ? new Date(paid.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : `Due ${new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      ] as [string, string, string, string]
    }),
  }
}
