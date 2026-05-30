'use client'

import { Card, colorClasses, DashboardShell, Sparkline } from '@/components/dashboard/shell'
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

const sections = {
  hustles: {
    title: 'Hustles',
    subtitle: 'Launch, monitor, and scale each micro-business from one operating view.',
    icon: BriefcaseIcon,
    color: 'olive',
    metrics: [
      ['Active hustles', '4', '+1 this week'],
      ['Monthly revenue', '$8,430', '+24.5%'],
      ['Open proposals', '11', '6 drafted by AI'],
    ],
    primary: 'Web Design Studio',
    rows: [
      ['Web Design Studio', 'Main hustle', '$4,320', '28.4% growth'],
      ['SEO Sprint Offers', 'Outbound active', '$2,020', '12 leads warming'],
      ['Content Repurposing', 'Productizing', '$1,350', '5 deliverables queued'],
      ['Newsletter Sponsorships', 'Testing', '$740', '2 replies today'],
    ],
  },
  'ai-agents': {
    title: 'AI Agents',
    subtitle: 'Control the workers that find prospects, write copy, follow up, invoice, and report.',
    icon: SparklesIcon,
    color: 'olive',
    metrics: [
      ['Active agents', '8', '23 runs today'],
      ['Human approvals', '5', '2 high-stakes replies'],
      ['Hours saved', '18.5', '+4.2 this week'],
    ],
    primary: 'Proposal Writer Agent',
    rows: [
      ['Lead Research Agent', 'Found 12 qualified leads', 'Running', 'Next check in 14 min'],
      ['Proposal Writer Agent', 'Drafted Acme proposal', 'Needs approval', 'High intent'],
      ['Invoice Generator', 'Created invoice #INV-0042', 'Complete', '$1,250'],
      ['Payment Chaser', 'Queued late-payment sequence', 'Scheduled', 'Tomorrow 9:00 AM'],
    ],
  },
  tasks: {
    title: 'Tasks',
    subtitle: 'Prioritize approvals and execution work that still needs human direction.',
    icon: ClipboardIcon,
    color: 'olive',
    metrics: [
      ['Due today', '7', '3 AI-assisted'],
      ['Blocked', '2', 'Need client input'],
      ['Completed', '18', '+6 vs yesterday'],
    ],
    primary: 'Review Acme proposal',
    rows: [
      ['Review client proposal', '10:00 AM', 'High impact', 'Approve copy'],
      ['Design landing page', '1:00 PM', 'In progress', 'Web Design Studio'],
      ['Follow up with 2 leads', '3:30 PM', 'AI drafted', 'Needs send approval'],
      ['Create Instagram content', '5:00 PM', 'Ready', 'Repurposed from blog'],
    ],
  },
  clients: {
    title: 'Clients',
    subtitle: 'Track relationships, replies, proposals, active work, and revenue per account.',
    icon: User2Icon,
    color: 'olive',
    metrics: [
      ['Active clients', '12', '+3 this month'],
      ['Hot prospects', '21', '9 replied'],
      ['Avg client value', '$620', '+18%'],
    ],
    primary: 'Acme Inc.',
    rows: [
      ['Acme Inc.', 'Proposal sent', '$1,250', 'Reply likely today'],
      ['BluePeak', 'SEO project active', '$850', 'Milestone 2 due'],
      ['BlogCo', 'Content writing', '$450', 'Invoice paid'],
      ['Northstar Studio', 'Discovery call', '$2,000 est.', 'Booked Friday'],
    ],
  },
  earnings: {
    title: 'Earnings',
    subtitle: 'See revenue, invoices, payout readiness, and late-payment automation.',
    icon: BanknotesIcon,
    color: 'olive',
    metrics: [
      ['Collected', '$8,430', '+24.5%'],
      ['Outstanding', '$2,100', '3 invoices'],
      ['Overdue', '$650', 'Chaser active'],
    ],
    primary: '$8,430 collected',
    rows: [
      ['Client Payment - Acme Inc.', 'Paid', '+ $1,250', 'May 24'],
      ['SEO Project - BluePeak', 'Paid', '+ $850', 'May 23'],
      ['Content Writing - BlogCo', 'Paid', '+ $450', 'May 22'],
      ['Invoice #INV-0045', 'Overdue', '$650', 'Chaser running'],
    ],
  },
  analytics: {
    title: 'Analytics',
    subtitle: 'Understand which offers, emails, agents, and channels are creating income.',
    icon: ChartLineIcon,
    color: 'olive',
    metrics: [
      ['Email conversion', '14.8%', '+3.1%'],
      ['Reply rate', '31%', '+7.4%'],
      ['Best offer', 'Web Design', '$4,320'],
    ],
    primary: 'Outbound is compounding',
    rows: [
      ['Cold email sequence A', '31% reply rate', '8 clients', '$3,400 attributed'],
      ['Portfolio landing page', '9.4% conversion', '42 visits', '5 booked calls'],
      ['AI proposal template', '44% close rate', '7 sent', '$2,100 won'],
      ['Instagram repurposing', '2.1% conversion', '180 views', 'Testing'],
    ],
  },
  opportunities: {
    title: 'Opportunities',
    subtitle: 'Qualified projects, upsells, client matches, and market gaps selected by AI.',
    icon: TargetIcon,
    color: 'olive',
    metrics: [
      ['Matched today', '17', '5 high confidence'],
      ['Est. pipeline', '$12.4K', '+$3.2K'],
      ['Upsells found', '6', '2 ready to pitch'],
    ],
    primary: 'High-paying Webflow project',
    rows: [
      ['High-Paying Project', '98% match', '$2K - $5K', 'Webflow developer needed'],
      ['New Client Match', '98% match', '$1.5K est.', 'Marketing agency needs SEO'],
      ['Upsell Opportunity', '85% match', '$700 est.', 'Copywriting for current web client'],
      ['Retainer Lead', '81% match', '$900/mo est.', 'Founder needs weekly content'],
    ],
  },
  integrations: {
    title: 'Integrations',
    subtitle: 'Connect the systems agents use to deploy sites, send emails, invoice, and log revenue.',
    icon: PaperclipIcon,
    color: 'olive',
    metrics: [
      ['Connected', '6', 'All healthy'],
      ['Events today', '148', 'Synced'],
      ['Failed syncs', '0', 'No action needed'],
    ],
    primary: 'Stripe connected',
    rows: [
      ['Stripe', 'Payments and invoices', 'Connected', 'Last sync 2 min ago'],
      ['Gmail', 'Cold email and replies', 'Connected', '23 emails sent'],
      ['Vercel', 'Website deployment', 'Connected', '4 live pages'],
      ['BigQuery', 'Conversion reporting', 'Connected', 'Daily export active'],
    ],
  },
  settings: {
    title: 'Settings',
    subtitle: 'Configure business defaults, approval rules, agent limits, and billing controls.',
    icon: CogIcon,
    color: 'olive',
    metrics: [
      ['Approval mode', 'Balanced', '2 rules active'],
      ['Daily email cap', '50', '23 used'],
      ['Plan', 'Free', 'Upgrade available'],
    ],
    primary: 'Human approval required for high-stakes replies',
    rows: [
      ['Business profile', 'SideHustleOS user defaults', 'Complete', 'Edit positioning'],
      ['Approval rules', 'Replies, invoices, discounts', 'Balanced', '2 rules active'],
      ['Agent limits', 'Outreach and spend controls', 'Healthy', '$450 ad cap'],
      ['Billing', 'Free plan', 'Active', 'Upgrade available'],
    ],
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

export function DashboardSectionPage({ section }: { section: SectionKey }) {
  const data = sections[section]
  const Icon = data.icon
  const theme = colorClasses(data.color)

  return (
    <DashboardShell title={data.title} subtitle={data.subtitle}>
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
            {data.rows.map((row) => (
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
            ))}
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
