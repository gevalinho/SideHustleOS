'use client'

import { Card, colorClasses, DashboardShell, Sparkline } from '@/components/dashboard/shell'
import { ArrowNarrowRightIcon } from '@/components/icons/arrow-narrow-right-icon'
import { BanknotesIcon } from '@/components/icons/banknotes-icon'
import { BriefcaseIcon } from '@/components/icons/briefcase-icon'
import { ChartLineIcon } from '@/components/icons/chart-line-icon'
import { CheckmarkIcon } from '@/components/icons/checkmark-icon'
import { DocumentIcon } from '@/components/icons/document-icon'
import { InboxIcon } from '@/components/icons/inbox-icon'
import { LightingBoltIcon } from '@/components/icons/lighting-bolt-icon'
import { RocketIcon } from '@/components/icons/rocket-icon'
import { SparklesIcon } from '@/components/icons/sparkles-icon'
import { StarIcon } from '@/components/icons/star-icon'
import { TargetIcon } from '@/components/icons/target-icon'

const stats = [
  { label: 'Total Revenue', value: '$8,430', delta: '+24.5%', icon: BanknotesIcon, color: 'blue', data: [4, 8, 7, 11, 10, 13, 9, 16, 12, 18, 15, 23, 20, 28, 35, 31, 24, 33, 27, 39, 42] },
  { label: 'Active Hustles', value: '4', delta: '+1 new this week', icon: BriefcaseIcon, color: 'blue', data: [2, 2, 3, 6, 5, 11, 10, 15, 17, 13, 12, 10, 16, 12, 11, 15, 22, 16, 21, 23, 23] },
  { label: 'AI Automations', value: '23', delta: '+15.2%', icon: SparklesIcon, color: 'pink', data: [7, 6, 7, 6, 8, 15, 18, 26, 19, 17, 25, 18, 19, 17, 24, 18, 17, 27, 26, 41, 43] },
  { label: 'Weekly Growth', value: '+18.6%', delta: 'vs previous 7 days', icon: ChartLineIcon, color: 'emerald', data: [3, 3, 4, 6, 5, 9, 8, 12, 10, 16, 11, 13, 14, 8, 12, 17, 14, 20, 15, 28, 26] },
]

const recommendations = [
  { title: 'Automate proposal follow-ups', detail: 'Save ~2.5 hours/week', action: 'Automate', icon: RocketIcon, color: 'blue' },
  { title: 'Increase rates for Web Design', detail: 'Market rate is 18% higher', action: 'View Insight', icon: BanknotesIcon, color: 'emerald' },
  { title: 'Repurpose content with AI', detail: 'Create 5+ assets from one blog', action: 'Try Now', icon: LightingBoltIcon, color: 'amber' },
]

const priorities = [
  { task: 'Review client proposal', time: '10:00 AM', done: true },
  { task: 'Design landing page', time: '1:00 PM' },
  { task: 'Follow up with 2 leads', time: '3:30 PM' },
  { task: 'Create content for Instagram', time: '5:00 PM' },
]

const transactions = [
  { name: 'Client Payment - Acme Inc.', meta: 'May 24, 2024', amount: '+ $1,250', color: 'emerald' },
  { name: 'SEO Project - BluePeak', meta: 'May 23, 2024', amount: '+ $850', color: 'cyan' },
  { name: 'Content Writing - BlogCo', meta: 'May 22, 2024', amount: '+ $450', color: 'blue' },
  { name: 'Canva Pro - Subscription', meta: 'May 21, 2024', amount: '- $12.99', color: 'rose', expense: true },
]

const agents = [
  { name: 'Proposal Writer Agent', detail: 'Generated proposal for Acme Inc.', time: '2 min ago', icon: StarIcon, color: 'blue' },
  { name: 'Lead Research Agent', detail: 'Found 12 new leads', time: '15 min ago', icon: TargetIcon, color: 'cyan' },
  { name: 'Content Repurposer', detail: 'Created 6 social posts', time: '1 hr ago', icon: DocumentIcon, color: 'orange' },
  { name: 'Invoice Generator', detail: 'Generated invoice #INV-0042', time: '2 hr ago', icon: InboxIcon, color: 'blue' },
]

const opportunities = [
  { title: 'High-Paying Project', detail: 'Webflow developer needed\nBudget: $2K - $5K', match: '98% Match', icon: BriefcaseIcon },
  { title: 'New Client Match', detail: 'Marketing agency looking for SEO', match: '98% Match', icon: DocumentIcon },
  { title: 'Upsell Opportunity', detail: 'Add copywriting to your Web Design service', match: '85% Match', icon: ChartLineIcon },
]

function StatCard({ stat }: { stat: (typeof stats)[number] }) {
  const Icon = stat.icon
  const color = colorClasses(stat.color)

  return (
    <Card className="min-h-36 p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <div className={`grid size-11 shrink-0 place-items-center rounded-lg ${color.bg} ${color.text} ring-1 ${color.ring}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-olive-700 dark:text-olive-300">{stat.label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-normal text-olive-950 dark:text-white">{stat.value}</p>
          <p className="mt-2 text-sm text-emerald-300">{stat.delta}</p>
        </div>
      </div>
      <div className="mt-2">
        <Sparkline data={stat.data} color={stat.color} />
      </div>
    </Card>
  )
}

function AiAssistant() {
  return (
    <Card className="p-4 sm:p-5 xl:col-span-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SparklesIcon className="size-5 text-sky-400" />
          <h2 className="font-semibold text-olive-950 dark:text-white">AI Assistant</h2>
        </div>
        <span className="rounded-md bg-sky-600/25 px-2.5 py-1 text-xs font-medium text-sky-800 dark:text-sky-100">3 New</span>
      </div>
      <p className="mt-3 text-sm text-olive-700 dark:text-olive-300">Recommendations for you</p>
      <div className="mt-4 space-y-2">
        {recommendations.map((item) => {
          const Icon = item.icon
          const color = colorClasses(item.color)
          return (
            <div key={item.title} className="flex items-center gap-3 rounded-lg border border-olive-950/5 dark:border-white/5 bg-white/70 dark:bg-white/[0.045] p-3">
              <div className={`grid size-10 place-items-center rounded-full ${color.bg} ${color.text}`}>
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-olive-950 dark:text-white">{item.title}</p>
                <p className="truncate text-xs text-olive-700 dark:text-olive-300">{item.detail}</p>
              </div>
              <button className="h-8 rounded-md border border-sky-400/40 bg-sky-50 px-3 text-xs font-medium text-sky-800 ring-1 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-100 dark:ring-sky-300/20">
                {item.action}
              </button>
            </div>
          )
        })}
      </div>
      <a href="#" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-400">
        View all recommendations <ArrowNarrowRightIcon className="size-3" />
      </a>
    </Card>
  )
}

function TopHustle() {
  return (
    <Card className="overflow-hidden xl:col-span-4">
      <div className="flex items-center justify-between border-b border-olive-950/10 dark:border-white/10 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <StarIcon className="size-5 text-amber-300" />
          <h2 className="font-semibold text-olive-950 dark:text-white">Top Performing Hustle</h2>
        </div>
        <button className="rounded-md border border-olive-950/10 dark:border-white/10 px-3 py-1.5 text-xs text-olive-950 dark:text-white">This Week</button>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-amber-400/15 text-amber-200">🏢</div>
          <p className="font-semibold text-olive-950 dark:text-white">Web Design Studio</p>
          <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-xs font-medium text-emerald-300">Main Hustle</span>
        </div>
        <p className="mt-5 text-sm text-olive-700 dark:text-olive-300">Revenue</p>
        <div className="flex items-end gap-3">
          <p className="text-3xl font-semibold tracking-normal text-olive-950 dark:text-white">$4,320</p>
          <p className="pb-1 text-sm text-emerald-300">↑ 28.4%</p>
        </div>
        <div className="mt-5 grid h-24 grid-cols-7 items-end gap-3 border-b border-olive-950/10 dark:border-white/10">
          {[48, 40, 62, 48, 68, 78, 86].map((height, index) => (
            <div key={index} className="w-full rounded-t-md bg-gradient-to-t from-sky-600 to-sky-400" style={{ height: `${height}%` }} />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 text-center text-xs text-olive-700 dark:text-olive-300">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>
      </div>
    </Card>
  )
}

function Priorities() {
  return (
    <Card className="p-4 sm:p-5 xl:col-span-4">
      <h2 className="font-semibold text-olive-950 dark:text-white">Today&apos;s Priorities</h2>
      <div className="mt-4 space-y-2">
        {priorities.map((item) => (
          <div key={item.task} className="flex items-center gap-3 rounded-lg border border-olive-950/10 dark:border-white/10 bg-olive-950/5 dark:bg-black/10 p-3">
            <span
              className={`grid size-4 place-items-center rounded border ${
                item.done ? 'border-sky-400 bg-sky-600 text-white' : 'border-olive-300/50'
              }`}
            >
              {item.done ? <CheckmarkIcon className="size-3" /> : null}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-olive-950 dark:text-white">{item.task}</span>
            <span className="text-xs text-olive-700 dark:text-olive-300">{item.time}</span>
          </div>
        ))}
      </div>
      <a href="#" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-sky-400">
        View full task list <ArrowNarrowRightIcon className="size-3" />
      </a>
    </Card>
  )
}

function EarningsOverview() {
  const segments = [
    { label: 'Web Design', value: '$4,320', share: '52%', color: 'bg-sky-500' },
    { label: 'SEO Services', value: '$2,020', share: '24%', color: 'bg-blue-400' },
    { label: 'Content Writing', value: '$1,350', share: '16%', color: 'bg-emerald-400' },
    { label: 'Other', value: '$740', share: '8%', color: 'bg-amber-400' },
  ]

  return (
    <Card className="p-4 sm:p-5 xl:col-span-4">
      <h2 className="font-semibold text-olive-950 dark:text-white">Earnings Overview</h2>
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative mx-auto size-36 shrink-0 rounded-full bg-[conic-gradient(#0ea5e9_0_52%,#3b82f6_52%_76%,#34d399_76%_92%,#f59e0b_92%_100%)]">
          <div className="absolute inset-8 grid place-items-center rounded-full bg-olive-100 dark:bg-[#07111d] text-center">
            <p className="text-lg font-semibold text-olive-950 dark:text-white">$8,430</p>
            <p className="text-xs text-olive-700 dark:text-olive-300">Total</p>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {segments.map((item) => (
            <div key={item.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-olive-800 dark:text-olive-200">
                <span className={`size-3 rounded ${item.color}`} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="text-olive-700 dark:text-olive-300">{item.share}</span>
              <span className="text-olive-700 dark:text-olive-300">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function RecentTransactions() {
  return (
    <Card className="p-4 sm:p-5 xl:col-span-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-olive-950 dark:text-white">Recent Transactions</h2>
        <a href="#" className="text-sm text-sky-400">
          View all
        </a>
      </div>
      <div className="mt-4 space-y-3">
        {transactions.map((item) => {
          const color = colorClasses(item.color)
          return (
            <div key={item.name} className="flex items-center gap-3">
              <div className={`grid size-9 place-items-center rounded-full ${color.bg} ${color.text}`}>
                <BanknotesIcon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-olive-950 dark:text-white">{item.name}</p>
                <p className="text-xs text-olive-600 dark:text-olive-400">{item.meta}</p>
              </div>
              <p className={`text-sm font-medium ${item.expense ? 'text-rose-300' : 'text-emerald-300'}`}>{item.amount}</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function AgentActivity() {
  return (
    <Card className="p-4 sm:p-5 xl:col-span-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-olive-950 dark:text-white">AI Agent Activity</h2>
        <a href="#" className="text-sm text-sky-400">
          View all
        </a>
      </div>
      <div className="mt-4 divide-y divide-olive-950/10 dark:divide-white/10">
        {agents.map((agent) => {
          const Icon = agent.icon
          const color = colorClasses(agent.color)
          return (
            <div key={agent.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className={`grid size-9 place-items-center rounded-full ${color.bg} ${color.text}`}>
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-olive-950 dark:text-white">{agent.name}</p>
                <p className="truncate text-xs text-olive-700 dark:text-olive-300">{agent.detail}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-olive-700 dark:text-olive-300">{agent.time}</p>
                <CheckmarkIcon className="mt-1 size-3 text-emerald-300" />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function Opportunities() {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <StarIcon className="size-5 text-amber-300" />
          <h2 className="font-semibold text-olive-950 dark:text-white">Opportunities for You</h2>
        </div>
        <a href="/opportunities" className="hidden items-center gap-2 text-sm font-medium text-sky-400 sm:inline-flex">
          View all opportunities <ArrowNarrowRightIcon className="size-3" />
        </a>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {opportunities.map((item) => {
          const Icon = item.icon
          return (
            <a key={item.title} href="/opportunities" className="flex items-center gap-4 rounded-lg border border-olive-950/10 bg-white/50 p-4 transition hover:bg-olive-950/[0.06] dark:border-white/10 dark:bg-white/[0.025] dark:hover:bg-white/[0.06]">
              <div className="grid size-10 place-items-center rounded-full bg-sky-600/15 text-sky-400">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-olive-950 dark:text-white">{item.title}</p>
                  <span className="shrink-0 rounded-full bg-sky-600/25 px-2 py-1 text-xs text-sky-800 dark:text-sky-100">{item.match}</span>
                </div>
                <p className="mt-1 whitespace-pre-line text-xs leading-5 text-olive-700 dark:text-olive-300">{item.detail}</p>
              </div>
              <ArrowNarrowRightIcon className="size-4 text-olive-950 dark:text-white" />
            </a>
          )
        })}
      </div>
    </Card>
  )
}

export default function Page() {
  return (
    <DashboardShell title="Welcome back, Arjun!" subtitle="Here's what's happening with your hustles today.">
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-12">
        <AiAssistant />
        <TopHustle />
        <Priorities />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-12">
        <EarningsOverview />
        <RecentTransactions />
        <AgentActivity />
      </section>

      <section className="mt-4">
        <Opportunities />
      </section>
    </DashboardShell>
  )
}
