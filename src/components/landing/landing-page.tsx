import Image from 'next/image'
import Link from 'next/link'

import { ArrowNarrowRightIcon } from '@/components/icons/arrow-narrow-right-icon'
import { BanknotesIcon } from '@/components/icons/banknotes-icon'
import { CalendarIcon } from '@/components/icons/calendar-icon'
import { ChartLineIcon } from '@/components/icons/chart-line-icon'
import { CheckmarkIcon } from '@/components/icons/checkmark-icon'
import { CloudIcon } from '@/components/icons/cloud-icon'
import { DocumentIcon } from '@/components/icons/document-icon'
import { InboxIcon } from '@/components/icons/inbox-icon'
import { RocketIcon } from '@/components/icons/rocket-icon'
import { SparklesIcon } from '@/components/icons/sparkles-icon'
import { TargetIcon } from '@/components/icons/target-icon'

const tabs = ['90-day roadmap', 'AI agents', 'Google Cloud stack', 'Monetization', 'Viral loop', 'Hackathon pitch']

const agents = [
  {
    name: 'SkillProfiler',
    icon: TargetIcon,
    color: 'bg-olive-950/5 text-olive-800 ring-olive-950/10 dark:bg-white/10 dark:text-olive-200 dark:ring-white/10',
    summary: 'Extracts monetizable skills from free-text input or an uploaded CV, then ranks each skill by market demand.',
    trigger: 'Runs once during onboarding.',
  },
  {
    name: 'BusinessBuilder',
    icon: RocketIcon,
    color: 'bg-olive-950/5 text-olive-800 ring-olive-950/10 dark:bg-white/10 dark:text-olive-200 dark:ring-white/10',
    summary: 'Generates three micro-business options with pricing, customer profile, USP, offer copy, and a deployable page.',
    trigger: 'Starts after the user approves their ranked skill profile.',
  },
  {
    name: 'ProspectHunter',
    icon: TargetIcon,
    color: 'bg-olive-950/5 text-olive-800 ring-olive-950/10 dark:bg-white/10 dark:text-olive-200 dark:ring-white/10',
    summary: 'Searches LinkedIn, Google, and directories for ideal clients. Scores every lead by fit and builds the CRM.',
    trigger: 'Runs every Monday morning.',
  },
  {
    name: 'OutreachAgent',
    icon: DocumentIcon,
    color: 'bg-olive-950/5 text-olive-800 ring-olive-950/10 dark:bg-white/10 dark:text-olive-200 dark:ring-white/10',
    summary: 'Writes personalized cold emails from prospect data and business context, tracks replies, and tests subject lines.',
    trigger: 'Runs daily on weekdays.',
  },
  {
    name: 'CloserAgent',
    icon: InboxIcon,
    color: 'bg-olive-950/5 text-olive-800 ring-olive-950/10 dark:bg-white/10 dark:text-olive-200 dark:ring-white/10',
    summary: 'Reads replies, classifies intent, drafts follow-ups, and routes high-stakes responses for human approval.',
    trigger: 'Triggered by new email replies.',
  },
  {
    name: 'OpsAgent',
    icon: BanknotesIcon,
    color: 'bg-olive-950/5 text-olive-800 ring-olive-950/10 dark:bg-white/10 dark:text-olive-200 dark:ring-white/10',
    summary: 'Generates invoices, sends payment reminders, drafts client updates, and answers routine customer questions.',
    trigger: 'Runs when jobs complete, plus daily at 9am.',
  },
  {
    name: 'GrowthAgent',
    icon: ChartLineIcon,
    color: 'bg-olive-950/5 text-olive-800 ring-olive-950/10 dark:bg-white/10 dark:text-olive-200 dark:ring-white/10',
    summary: 'Runs weekly BigQuery analysis to find winning outreach templates, prospect segments, and businesses.',
    trigger: 'Runs every Sunday morning.',
  },
]

const proof = [
  ['50 users', 'first cohort target'],
  ['$30K', '90-day direct user output'],
  ['3 clients', 'per user milestone'],
  ['$450', 'initial ad spend cap'],
]

const stack = [
  ['Cloud Run', 'deploys generated landing pages and agent services'],
  ['Pub/Sub', 'coordinates prospect, email, invoice, and reply events'],
  ['Firestore', 'stores leads, hustles, tasks, and approval queues'],
  ['BigQuery', 'reports conversion rates by template and channel'],
  ['Gmail API', 'sends outreach and reads replies with audit logs'],
  ['Stripe', 'creates products, invoices, and revenue evidence'],
]

function AgentCard({ agent, index }: { agent: (typeof agents)[number]; index: number }) {
  const Icon = agent.icon

  return (
    <article className="group rounded-lg border border-olive-950/10 bg-white/85 p-5 shadow-sm shadow-olive-950/5 ring-1 ring-white/70 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-olive-950/10 dark:border-white/10 dark:bg-white/[0.045] dark:ring-white/[0.03]">
      <div className="flex items-center justify-between gap-3">
        <div className={`grid size-11 place-items-center rounded-lg ring-1 ${agent.color}`}>
          <Icon className="size-5" />
        </div>
        <span className="text-xs font-medium text-olive-500 dark:text-olive-400">0{index + 1}</span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-olive-950 dark:text-white">{agent.name}</h3>
      <p className="mt-3 text-sm leading-6 text-olive-700 dark:text-olive-300">{agent.summary}</p>
      <p className="mt-5 border-t border-olive-950/10 pt-4 text-xs leading-5 text-olive-600 dark:border-white/10 dark:text-olive-400">
        <span className="font-semibold text-olive-800 dark:text-olive-200">Trigger:</span> {agent.trigger}
      </p>
    </article>
  )
}

function MiniDashboard() {
  return (
    <div className="relative mx-auto w-full max-w-5xl rounded-xl border border-white/20 bg-olive-950 p-4 shadow-2xl shadow-olive-950/30 ring-1 ring-white/10">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="text-sm text-olive-200">AI business operating system</p>
          <p className="mt-1 text-xl font-semibold text-white">Web Design Studio</p>
        </div>
        <div className="rounded-md bg-white/10 px-3 py-1 text-sm font-medium text-olive-200">Revenue active</div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ['$8,430', 'subscriber revenue earned'],
          ['23', 'agent actions today'],
          ['31%', 'reply rate this week'],
        ].map(([value, label]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-2xl font-semibold text-white">{value}</p>
            <p className="mt-1 text-sm text-olive-300">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-white">Agent pipeline</p>
            <SparklesIcon className="size-5 text-olive-300" />
          </div>
          <div className="mt-4 space-y-3">
            {['Found 12 matched prospects', 'Drafted 10 personalized emails', 'Prepared invoice #INV-0042'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md bg-white/[0.035] p-3 text-sm text-olive-200">
                <span className="grid size-5 place-items-center rounded-full bg-white/10 text-olive-300">
                  <CheckmarkIcon className="size-3" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="font-medium text-white">Human role</p>
          <p className="mt-3 text-sm leading-6 text-olive-300">
            Set direction, approve high-stakes replies, collect money. The agents handle the repetitive business work.
          </p>
          <div className="mt-5 h-2 rounded-full bg-white/10">
            <div className="h-full w-4/5 rounded-full bg-olive-300" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <main className="min-h-dvh bg-olive-100 text-olive-950 dark:bg-olive-950 dark:text-white">
      <section className="relative overflow-hidden">
        <Image src="/img/photos/1.webp" alt="" fill priority className="object-cover opacity-15 dark:opacity-10" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,248,245,0.94),rgba(238,241,235,0.98))] dark:bg-[linear-gradient(180deg,rgba(21,48,13,0.94),rgba(21,48,13,0.98))]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-6 pb-16 lg:px-8 lg:pb-20">
          <header className="flex items-center justify-between gap-6">
            <Link href="/landing" className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-olive-950 text-white dark:bg-olive-300 dark:text-olive-950 shadow-lg shadow-olive-950/10">
                <SparklesIcon className="size-5" />
              </span>
              <span className="text-xl font-semibold">SideHustle<span className="text-olive-500 dark:text-olive-300">OS</span></span>
            </Link>
            <nav className="hidden items-center gap-2 rounded-full border border-olive-950/10 bg-white/70 p-1 text-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05] md:flex">
              {tabs.map((tab, index) => (
                <a
                  key={tab}
                  href={`#${tab.toLowerCase().replaceAll(' ', '-')}`}
                  className={`rounded-full px-4 py-2 ${
                    index === 1 ? 'bg-olive-950 text-white dark:bg-olive-300 dark:text-olive-950 shadow-sm' : 'text-olive-700 hover:bg-olive-950/5 dark:text-olive-300 dark:hover:bg-white/10'
                  }`}
                >
                  {tab}
                </a>
              ))}
            </nav>
            <Link href="/login" className="rounded-md bg-olive-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-olive-950">
              Sign in
            </Link>
          </header>

          <div className="mt-16 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-olive-950/10 bg-olive-950/5 px-3 py-1 text-sm font-medium text-olive-800 dark:border-white/10 dark:bg-white/10 dark:text-olive-200">
                Entrepreneurship and job creation
              </p>
              <h1 className="mt-6 text-5xl font-semibold tracking-normal text-olive-950 dark:text-white sm:text-6xl">
                The AI operating system that manufactures side hustles.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-olive-700 dark:text-olive-300">
                SideHustleOS turns skills into a live business: offer, landing page, prospects, outreach, replies,
                invoices, follow-ups, and reporting. Humans set direction. Agents do the work.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive-950 px-5 text-sm font-semibold text-white hover:bg-olive-800">
                  Create account <ArrowNarrowRightIcon className="size-3" />
                </Link>
                <a href="#ai-agents" className="inline-flex h-11 items-center justify-center rounded-md border border-olive-950/10 bg-white/70 px-5 text-sm font-semibold text-olive-950 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
                  Explore the agent system
                </a>
              </div>
            </div>
            <MiniDashboard />
          </div>
        </div>
      </section>

      <section className="border-y border-olive-950/10 bg-white/60 py-6 dark:border-white/10 dark:bg-white/[0.035]">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {proof.map(([value, label]) => (
            <div key={label}>
              <p className="text-3xl font-semibold text-olive-950 dark:text-white">{value}</p>
              <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="ai-agents" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-olive-800 dark:text-olive-300">AI agents</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal text-olive-950 dark:text-white">
            Seven agents move a user from skill to revenue.
          </h2>
          <p className="mt-4 text-base leading-7 text-olive-700 dark:text-olive-300">
            Remove the AI and the product stops existing. The agents are not assistants bolted onto a workflow. They are
            the operating labor that researches, writes, deploys, sells, invoices, and improves the business.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {agents.map((agent, index) => (
            <AgentCard key={agent.name} agent={agent} index={index} />
          ))}
        </div>
      </section>

      <section id="google-cloud-stack" className="bg-white/65 py-16 dark:bg-white/[0.035]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <CloudIcon className="size-8 text-olive-800 dark:text-olive-300" />
            <h2 className="mt-4 text-3xl font-semibold text-olive-950 dark:text-white">Built for auditable execution.</h2>
            <p className="mt-4 text-base leading-7 text-olive-700 dark:text-olive-300">
              Every business action creates evidence: agent logs, email events, invoices, Stripe revenue, and BigQuery
              conversion reports.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {stack.map(([name, detail]) => (
              <div key={name} className="rounded-lg border border-olive-950/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.045]">
                <p className="font-semibold text-olive-950 dark:text-white">{name}</p>
                <p className="mt-2 text-sm leading-6 text-olive-700 dark:text-olive-300">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="monetization" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            ['User outcome', 'Every subscriber launches a micro-business and works toward three paying clients in 90 days.'],
            ['Platform revenue', 'Subscription plans unlock agent volume, advanced analytics, and more integrations.'],
            ['Economic proof', 'Stripe exports, Pub/Sub logs, BigQuery reports, and user testimonials show real output.'],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-lg border border-olive-950/10 bg-white/75 p-6 dark:border-white/10 dark:bg-white/[0.045]">
              <h3 className="text-lg font-semibold text-olive-950 dark:text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-olive-700 dark:text-olive-300">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="hackathon-pitch" className="px-6 pb-16 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-xl bg-olive-950 px-6 py-10 text-white dark:bg-white dark:text-olive-950 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <CalendarIcon className="size-7 text-olive-300 dark:text-olive-800" />
              <h2 className="mt-4 text-3xl font-semibold">In 90 days, users should have income, not just software.</h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-olive-200 dark:text-olive-700">
                If 50 users each land 3 clients at $200/client, SideHustleOS creates $30,000 in direct economic output
                for its users.
              </p>
            </div>
            <Link href="/register" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/20 dark:bg-olive-950 dark:text-white dark:hover:bg-olive-800">
              Create account <ArrowNarrowRightIcon className="size-3" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
