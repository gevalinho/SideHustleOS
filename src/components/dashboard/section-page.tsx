'use client'

import { Card, colorClasses, DashboardShell, Sparkline } from '@/components/dashboard/shell'
import type { DashboardMenuData, DashboardUser } from '@/components/dashboard/shell'
import { ArrowNarrowRightIcon } from '@/components/icons/arrow-narrow-right-icon'
import { BanknotesIcon } from '@/components/icons/banknotes-icon'
import { BriefcaseIcon } from '@/components/icons/briefcase-icon'
import { ChartLineIcon } from '@/components/icons/chart-line-icon'
import { CheckmarkIcon } from '@/components/icons/checkmark-icon'
import { ClipboardIcon } from '@/components/icons/clipboard-icon'
import { CogIcon } from '@/components/icons/cog-icon'
import { PaperclipIcon } from '@/components/icons/paperclip-icon'
import { SparklesIcon } from '@/components/icons/sparkles-icon'
import { TargetIcon } from '@/components/icons/target-icon'
import { User2Icon } from '@/components/icons/user-2-icon'

type SectionKey =
  | 'hustles'
  | 'ai-agents'
  | 'tasks'
  | 'clients'
  | 'earnings'
  | 'analytics'
  | 'opportunities'
  | 'integrations'
  | 'settings'

type SectionDataOverride = {
  metrics: [string, string, string][]
  primary: string
  rows: [string, string, string, string][]
}

const sections = {
  hustles: {
    title: 'Hustles',
    subtitle: 'Launch, monitor, and scale each micro-business from one operating view.',
    icon: BriefcaseIcon,
    color: 'olive',
    metrics: [
      ['Active hustles', '0', 'Connect endpoint'],
      ['Monthly revenue', '$0', 'No records yet'],
      ['Open tasks', '0', 'No records yet'],
    ],
    primary: 'No hustles yet',
    rows: [],
  },
  'ai-agents': {
    title: 'AI Agents',
    subtitle: 'Control the workers that find prospects, write copy, follow up, invoice, and report.',
    icon: SparklesIcon,
    color: 'olive',
    metrics: [
      ['Active agents', '0', 'Connect endpoint'],
      ['Human approvals', '0', 'No records yet'],
      ['Success rate', '0%', 'No records yet'],
    ],
    primary: 'No agents yet',
    rows: [],
  },
  tasks: {
    title: 'Tasks',
    subtitle: 'Prioritize approvals and execution work that still needs human direction.',
    icon: ClipboardIcon,
    color: 'olive',
    metrics: [
      ['Due today', '0', 'Connect endpoint'],
      ['Blocked', '0', 'No records yet'],
      ['Completed', '0', 'No records yet'],
    ],
    primary: 'No tasks yet',
    rows: [],
  },
  clients: {
    title: 'Clients',
    subtitle: 'Track relationships, replies, proposals, active work, and revenue per account.',
    icon: User2Icon,
    color: 'olive',
    metrics: [
      ['Active clients', '0', 'Connect endpoint'],
      ['Hot prospects', '0', 'No records yet'],
      ['Avg client value', '$0', 'No records yet'],
    ],
    primary: 'No clients yet',
    rows: [],
  },
  earnings: {
    title: 'Earnings',
    subtitle: 'See revenue, invoices, payout readiness, and late-payment automation.',
    icon: BanknotesIcon,
    color: 'olive',
    metrics: [
      ['Collected', '$0', 'Connect endpoint'],
      ['Outstanding', '$0', 'No records yet'],
      ['Overdue', '$0', 'No records yet'],
    ],
    primary: '$0 collected',
    rows: [],
  },
  analytics: {
    title: 'Analytics',
    subtitle: 'Understand which offers, emails, agents, and channels are creating income.',
    icon: ChartLineIcon,
    color: 'olive',
    metrics: [
      ['Email conversion', '0%', 'Connect endpoint'],
      ['Reply rate', '0%', 'No records yet'],
      ['Best offer', 'None', 'No records yet'],
    ],
    primary: 'No analytics yet',
    rows: [],
  },
  opportunities: {
    title: 'Opportunities',
    subtitle: 'Qualified projects, upsells, client matches, and market gaps selected by AI.',
    icon: TargetIcon,
    color: 'olive',
    metrics: [
      ['Matched today', '0', 'Connect endpoint'],
      ['Est. pipeline', '$0', 'No records yet'],
      ['Upsells found', '0', 'No records yet'],
    ],
    primary: 'No opportunities yet',
    rows: [],
  },
  integrations: {
    title: 'Integrations',
    subtitle: 'Connect the systems agents use to deploy sites, send emails, invoice, and log revenue.',
    icon: PaperclipIcon,
    color: 'olive',
    metrics: [
      ['Connected', '0', 'Connect endpoint'],
      ['Events today', '0', 'No records yet'],
      ['Failed syncs', '0', 'No records yet'],
    ],
    primary: 'No integrations yet',
    rows: [],
  },
  settings: {
    title: 'Settings',
    subtitle: 'Configure business defaults, approval rules, agent limits, and billing controls.',
    icon: CogIcon,
    color: 'olive',
    metrics: [
      ['Approval mode', 'Not configured', 'Connect endpoint'],
      ['Daily email cap', '0', 'No records yet'],
      ['Plan', 'Free', 'Upgrade available'],
    ],
    primary: 'No settings profile yet',
    rows: [],
  },
} satisfies Record<SectionKey, {
  title: string
  subtitle: string
  icon: typeof BriefcaseIcon
  color: string
  metrics: [string, string, string][]
  primary: string
  rows: [string, string, string, string][]
}>

function MetricCard({ metric, color }: { metric: [string, string, string]; color: string }) {
  const theme = colorClasses(color)

  return (
    <Card className="p-4 sm:p-5">
      <p className="text-sm font-medium text-olive-700 dark:text-olive-300">{metric[0]}</p>
      <p className="mt-2 text-2xl font-semibold text-olive-950 dark:text-white">{metric[1]}</p>
      <p className={`mt-2 text-sm font-medium ${theme.text}`}>{metric[2]}</p>
    </Card>
  )
}

export function DashboardSectionPage({
  section,
  user,
  sectionData,
  menuData,
}: {
  section: SectionKey
  user: DashboardUser
  sectionData?: SectionDataOverride
  menuData?: DashboardMenuData
}) {
  const defaults = sections[section]
  const data = {
    ...defaults,
    metrics: sectionData?.metrics ?? defaults.metrics,
    primary: sectionData?.primary ?? defaults.primary,
    rows: sectionData?.rows ?? defaults.rows,
  }
  const Icon = data.icon
  const theme = colorClasses(data.color)

  return (
    <DashboardShell title={data.title} subtitle={data.subtitle} user={user} menuData={menuData}>
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {data.metrics.map((metric) => (
          <MetricCard key={metric[0]} metric={metric} color={data.color} />
        ))}
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-olive-950/10 dark:border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
              <div className={`grid size-11 place-items-center rounded-lg ${theme.bg} ${theme.text} ring-1 ${theme.ring}`}>
                <Icon className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold text-olive-950 dark:text-white">{data.primary}</h2>
                <p className="text-sm text-olive-700 dark:text-olive-300">Priority operating view</p>
              </div>
            </div>
            <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-olive-950 dark:bg-olive-300 px-3 text-sm font-medium text-white">
              Create action <ArrowNarrowRightIcon className="size-3" />
            </button>
          </div>

          <div className="divide-y divide-olive-950/10 dark:divide-white/10">
            {data.rows.length ? data.rows.map((row) => (
              <div key={row[0]} className="grid gap-3 p-4 sm:grid-cols-[1.2fr_0.8fr_0.7fr_1fr] sm:items-center sm:p-5">
                <div className="flex items-center gap-3">
                  <div className={`grid size-9 place-items-center rounded-full ${theme.bg} ${theme.text}`}>
                    <Icon className="size-4" />
                  </div>
                  <p className="font-medium text-olive-950 dark:text-white">{row[0]}</p>
                </div>
                <p className="text-sm text-olive-700 dark:text-olive-300">{row[1]}</p>
                <p className="text-sm font-medium text-olive-950 dark:text-white">{row[2]}</p>
                <p className="text-sm text-olive-700 dark:text-olive-300">{row[3]}</p>
              </div>
            )) : (
              <div className="p-5 text-sm text-olive-700 dark:text-olive-300">No records returned for this section yet.</div>
            )}
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-olive-950 dark:text-white">AI next action</h2>
              <SparklesIcon className="size-5 text-olive-800 dark:text-olive-200" />
            </div>
            <p className="mt-3 text-sm leading-6 text-olive-700 dark:text-olive-300">
              SideHustleOS has enough signal to draft the next outreach, proposal, invoice, or optimization for this section.
            </p>
            <button className="mt-5 h-9 rounded-md border border-olive-950/10 dark:border-white/10 bg-white px-3 text-sm font-medium text-olive-800 ring-1 ring-olive-950/10 dark:bg-white/10 dark:text-white dark:ring-white/10">
              Review recommendation
            </button>
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="font-semibold text-olive-950 dark:text-white">Performance trend</h2>
            <div className="mt-5">
              <Sparkline data={[5, 7, 6, 9, 13, 11, 17, 15, 19, 24, 22, 28, 31, 29, 35, 42]} color={data.color} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-white/60 dark:bg-white/[0.035] p-3">
                <p className="text-olive-700 dark:text-olive-300">Signal quality</p>
                <p className="mt-1 font-medium text-olive-950 dark:text-white">High</p>
              </div>
              <div className="rounded-md bg-white/60 dark:bg-white/[0.035] p-3">
                <p className="text-olive-700 dark:text-olive-300">Automation fit</p>
                <p className="mt-1 font-medium text-olive-950 dark:text-white">Strong</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="font-semibold text-olive-950 dark:text-white">Execution checklist</h2>
            <div className="mt-4 space-y-3">
              {['AI identified next move', 'Human approval gate ready', 'Revenue impact tracked'].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-olive-800 dark:text-olive-200">
                  <span className="grid size-5 place-items-center rounded-full bg-olive-950/5 dark:bg-white/10 text-olive-700 dark:text-olive-300">
                    <CheckmarkIcon className="size-3" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </DashboardShell>
  )
}
