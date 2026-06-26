import Link from 'next/link'
import type { ComponentType, HTMLAttributes, ReactNode, SVGProps } from 'react'

import { createAdminBroadcast, overrideAdminDispute, updateAdminUserPlan, updateAdminUserStatus } from '@/app/admin/actions'
import type { DashboardUser } from '@/components/dashboard/shell'
import { BanknotesIcon } from '@/components/icons/banknotes-icon'
import { BellIcon } from '@/components/icons/bell-icon'
import { ChartLineIcon } from '@/components/icons/chart-line-icon'
import { ClipboardIcon } from '@/components/icons/clipboard-icon'
import { CogIcon } from '@/components/icons/cog-icon'
import { LockOpenIcon } from '@/components/icons/lock-open-icon'
import { ShieldExclamationIcon } from '@/components/icons/shield-exclamation-icon'
import { SparklesIcon } from '@/components/icons/sparkles-icon'
import { User2Icon } from '@/components/icons/user-2-icon'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

type Paginated<T> = {
  items: T[]
  pagination: Pagination
}

type AdminDashboardQuery = {
  usersPage?: string
  agentsPage?: string
  logsPage?: string
  disputesPage?: string
  broadcastsPage?: string
}

type AdminDashboardData = {
  stats: {
    users: {
      total: number
      paid: number
      free: number
      suspended: number
      banned: number
    }
    revenue: {
      collected: number
      outstanding: number
    }
    operations: {
      activeHustles: number
      clients: number
      opportunities: number
      runningAgents: number
    }
  }
  health: {
    status: string
    checkedAt: string
    services: { name: string; status: string; records?: number }[]
  }
  users: {
    items: {
      id: string
      name: string
      email: string
      role: string
      plan: string
      adminStatus: string
      statusReason?: string | null
      createdAt: string
    }[]
    pagination: Pagination
  }
  runningAgents: Paginated<{
    id: string
    name: string
    type: string
    status: string
    runsToday: number
    approvalsPending: number
  }>
  agentLogs: Paginated<{
    id: string
    level: string
    message: string
    evidence: string
    createdAt: string
  }>
  disputes: Paginated<{
    id: string
    title: string
    amount: number
    status: string
    createdAt: string
  }>
  broadcasts: Paginated<{
    id: string
    title: string
    audience: string
    deliveredCount: number
    createdAt: string
  }>
}

const navItems = [
  { label: 'Overview', href: '#overview', icon: ChartLineIcon },
  { label: 'Users', href: '#users', icon: User2Icon },
  { label: 'Operations', href: '#operations', icon: SparklesIcon },
  { label: 'Risk', href: '#risk', icon: ShieldExclamationIcon },
  { label: 'System', href: '#system', icon: CogIcon },
]

function currency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function initials(name: string, email: string) {
  return (name || email).slice(0, 2).toUpperCase()
}

function formatPlan(plan: string) {
  return plan.replaceAll('_', ' ')
}

function AdminCard({ children, className = '', ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section
      {...props}
      className={`rounded-lg border border-olive-950/10 bg-white/85 shadow-xl shadow-olive-950/5 ring-1 ring-white/70 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 dark:ring-white/[0.04] ${className}`}
    >
      {children}
    </section>
  )
}

function SectionHeader({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-olive-950/10 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-olive-950 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">{detail}</p>
      </div>
      {action}
    </div>
  )
}

function StatusPill({ tone = 'neutral', children }: { tone?: 'neutral' | 'good' | 'warning' | 'danger'; children: ReactNode }) {
  const styles = {
    neutral: 'bg-olive-950/5 text-olive-800 ring-olive-950/10 dark:bg-white/10 dark:text-olive-200 dark:ring-white/10',
    good: 'bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-200',
    warning: 'bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:text-amber-200',
    danger: 'bg-red-500/10 text-red-700 ring-red-600/20 dark:text-red-200',
  }

  return <span className={`inline-flex h-6 items-center rounded-full px-2 text-xs font-medium capitalize ring-1 ${styles[tone]}`}>{children}</span>
}

function pageHref(query: AdminDashboardQuery, key: keyof AdminDashboardQuery, page: number, hash: string) {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([name, value]) => {
    if (value && name !== key) {
      params.set(name, value)
    }
  })

  if (page > 1) {
    params.set(key, String(page))
  }

  const search = params.toString()

  return `${search ? `?${search}` : '/admin'}${hash}`
}

function PaginationControls({
  pagination,
  query,
  pageKey,
  hash,
}: {
  pagination: Pagination
  query: AdminDashboardQuery
  pageKey: keyof AdminDashboardQuery
  hash: string
}) {
  const start = pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0
  const end = Math.min(pagination.page * pagination.limit, pagination.total)
  const previousPage = Math.max(pagination.page - 1, 1)
  const nextPage = Math.min(pagination.page + 1, pagination.totalPages)
  const previousDisabled = pagination.page <= 1
  const nextDisabled = pagination.page >= pagination.totalPages

  return (
    <div className="flex flex-col gap-3 border-t border-olive-950/10 px-4 py-3 text-sm dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-olive-700 dark:text-olive-300">
        Showing {start}-{end} of {pagination.total}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={pageHref(query, pageKey, previousPage, hash)}
          aria-disabled={previousDisabled}
          className={`rounded-md border border-olive-950/10 px-3 py-2 font-medium dark:border-white/10 ${
            previousDisabled
              ? 'pointer-events-none text-olive-400 dark:text-olive-600'
              : 'bg-white/70 text-olive-800 hover:bg-white dark:bg-white/[0.06] dark:text-olive-200 dark:hover:bg-white/[0.1]'
          }`}
        >
          Previous
        </Link>
        <span className="min-w-20 text-center text-olive-700 dark:text-olive-300">
          {pagination.page} / {pagination.totalPages}
        </span>
        <Link
          href={pageHref(query, pageKey, nextPage, hash)}
          aria-disabled={nextDisabled}
          className={`rounded-md border border-olive-950/10 px-3 py-2 font-medium dark:border-white/10 ${
            nextDisabled
              ? 'pointer-events-none text-olive-400 dark:text-olive-600'
              : 'bg-white/70 text-olive-800 hover:bg-white dark:bg-white/[0.06] dark:text-olive-200 dark:hover:bg-white/[0.1]'
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  )
}

function AdminUserControls({ item, currentUserId }: { item: AdminDashboardData['users']['items'][number]; currentUserId: string }) {
  const isAdminAccount = item.role === 'admin'
  const statusDisabled = isAdminAccount && item.id === currentUserId

  return (
    <div className="grid min-w-[360px] gap-2 lg:min-w-[420px]">
      <form action={updateAdminUserPlan} className="flex items-center gap-2">
        <input type="hidden" name="userId" value={item.id} />
        <label className="sr-only" htmlFor={`plan-${item.id}`}>
          Change plan for {item.email}
        </label>
        <select
          id={`plan-${item.id}`}
          name="plan"
          defaultValue={item.plan}
          className="h-9 min-w-32 rounded-md border border-olive-950/10 bg-white px-2 text-xs font-medium text-olive-800 outline-none focus:border-olive-600 focus:ring-2 focus:ring-olive-600/20 dark:border-white/10 dark:bg-white/10 dark:text-olive-100"
        >
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="revenue_share">Revenue share</option>
        </select>
        <button type="submit" className="h-9 rounded-md bg-olive-950 px-3 text-xs font-semibold text-white dark:bg-olive-300 dark:text-olive-950">
          Save plan
        </button>
      </form>

      <form action={updateAdminUserStatus} className="grid gap-2 sm:grid-cols-[0.75fr_1fr_auto] sm:items-center">
        <input type="hidden" name="userId" value={item.id} />
        <label className="sr-only" htmlFor={`status-${item.id}`}>
          Change status for {item.email}
        </label>
        <select
          id={`status-${item.id}`}
          name="status"
          defaultValue={item.adminStatus}
          disabled={statusDisabled}
          className="h-9 rounded-md border border-olive-950/10 bg-white px-2 text-xs font-medium text-olive-800 outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:border-olive-600 focus:ring-2 focus:ring-olive-600/20 dark:border-white/10 dark:bg-white/10 dark:text-olive-100"
        >
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <label className="sr-only" htmlFor={`reason-${item.id}`}>
          Moderation reason
        </label>
        <input
          id={`reason-${item.id}`}
          name="reason"
          defaultValue={item.statusReason ?? (item.adminStatus === 'active' ? 'Account reviewed by admin.' : '')}
          placeholder="Reason"
          disabled={statusDisabled}
          className="h-9 rounded-md border border-olive-950/10 bg-white px-2 text-xs text-olive-800 outline-none placeholder:text-olive-400 disabled:cursor-not-allowed disabled:opacity-60 focus:border-olive-600 focus:ring-2 focus:ring-olive-600/20 dark:border-white/10 dark:bg-white/10 dark:text-olive-100 dark:placeholder:text-olive-500"
        />
        <button
          type="submit"
          disabled={statusDisabled}
          className="h-9 rounded-md border border-olive-950/10 bg-white/70 px-3 text-xs font-semibold text-olive-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-olive-200"
        >
          Save status
        </button>
      </form>
      {statusDisabled ? <p className="text-xs text-olive-600 dark:text-olive-400">Your active admin account is protected from self-moderation.</p> : null}
    </div>
  )
}

function BroadcastForm() {
  return (
    <form action={createAdminBroadcast} className="mt-4 space-y-2 rounded-md border border-olive-950/10 bg-white/50 p-3 dark:border-white/10 dark:bg-white/[0.035]">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <label className="sr-only" htmlFor="broadcast-title">
          Broadcast title
        </label>
        <input
          id="broadcast-title"
          name="title"
          required
          placeholder="Broadcast title"
          className="h-9 rounded-md border border-olive-950/10 bg-white px-2 text-xs text-olive-800 outline-none placeholder:text-olive-400 focus:border-olive-600 focus:ring-2 focus:ring-olive-600/20 dark:border-white/10 dark:bg-white/10 dark:text-olive-100"
        />
        <label className="sr-only" htmlFor="broadcast-audience">
          Broadcast audience
        </label>
        <select
          id="broadcast-audience"
          name="audience"
          defaultValue="all"
          className="h-9 rounded-md border border-olive-950/10 bg-white px-2 text-xs font-medium text-olive-800 outline-none focus:border-olive-600 focus:ring-2 focus:ring-olive-600/20 dark:border-white/10 dark:bg-white/10 dark:text-olive-100"
        >
          <option value="all">All users</option>
          <option value="paid">Paid users</option>
        </select>
      </div>
      <label className="sr-only" htmlFor="broadcast-body">
        Broadcast body
      </label>
      <textarea
        id="broadcast-body"
        name="body"
        required
        rows={3}
        placeholder="Message body"
        className="w-full resize-none rounded-md border border-olive-950/10 bg-white px-2 py-2 text-xs text-olive-800 outline-none placeholder:text-olive-400 focus:border-olive-600 focus:ring-2 focus:ring-olive-600/20 dark:border-white/10 dark:bg-white/10 dark:text-olive-100"
      />
      <button type="submit" className="h-9 rounded-md bg-olive-950 px-3 text-xs font-semibold text-white dark:bg-olive-300 dark:text-olive-950">
        Send broadcast
      </button>
    </form>
  )
}

function DisputeOverrideForm({ dispute }: { dispute: AdminDashboardData['disputes']['items'][number] }) {
  return (
    <form action={overrideAdminDispute} className="grid gap-2 lg:grid-cols-[0.75fr_0.55fr_1fr_auto] lg:items-center">
      <input type="hidden" name="disputeId" value={dispute.id} />
      <label className="sr-only" htmlFor={`winner-${dispute.id}`}>
        Dispute winner
      </label>
      <select
        id={`winner-${dispute.id}`}
        name="winner"
        defaultValue="split"
        className="h-9 rounded-md border border-olive-950/10 bg-white px-2 text-xs font-medium text-olive-800 outline-none focus:border-olive-600 focus:ring-2 focus:ring-olive-600/20 dark:border-white/10 dark:bg-white/10 dark:text-olive-100"
      >
        <option value="client">Client</option>
        <option value="freelancer">Freelancer</option>
        <option value="split">Split</option>
      </select>
      <label className="sr-only" htmlFor={`split-${dispute.id}`}>
        Split percent
      </label>
      <input
        id={`split-${dispute.id}`}
        name="splitPercent"
        type="number"
        min={1}
        max={99}
        defaultValue={50}
        className="h-9 rounded-md border border-olive-950/10 bg-white px-2 text-xs text-olive-800 outline-none focus:border-olive-600 focus:ring-2 focus:ring-olive-600/20 dark:border-white/10 dark:bg-white/10 dark:text-olive-100"
      />
      <label className="sr-only" htmlFor={`reason-${dispute.id}`}>
        Override reason
      </label>
      <input
        id={`reason-${dispute.id}`}
        name="adminReason"
        required
        placeholder="Override reason"
        className="h-9 rounded-md border border-olive-950/10 bg-white px-2 text-xs text-olive-800 outline-none placeholder:text-olive-400 focus:border-olive-600 focus:ring-2 focus:ring-olive-600/20 dark:border-white/10 dark:bg-white/10 dark:text-olive-100"
      />
      <button type="submit" className="h-9 rounded-md bg-olive-950 px-3 text-xs font-semibold text-white dark:bg-olive-300 dark:text-olive-950">
        Override
      </button>
    </form>
  )
}

function statusTone(status: string): 'neutral' | 'good' | 'warning' | 'danger' {
  if (status === 'ok' || status === 'active' || status === 'running') return 'good'
  if (status === 'suspended' || status === 'open') return 'warning'
  if (status === 'banned' || status === 'error') return 'danger'
  return 'neutral'
}

function MetricCard({ label, value, detail, icon: Icon, tone = 'neutral' }: { label: string; value: string; detail: string; icon: Icon; tone?: 'neutral' | 'good' | 'warning' | 'danger' }) {
  const accents = {
    neutral: 'bg-olive-950/5 text-olive-800 ring-olive-950/10 dark:bg-white/10 dark:text-olive-200 dark:ring-white/10',
    good: 'bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-200',
    warning: 'bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:text-amber-200',
    danger: 'bg-red-500/10 text-red-700 ring-red-600/20 dark:text-red-200',
  }

  return (
    <AdminCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-olive-700 dark:text-olive-300">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-olive-950 dark:text-white">{value}</p>
          <p className="mt-2 truncate text-sm text-olive-700 dark:text-olive-300">{detail}</p>
        </div>
        <div className={`grid size-11 shrink-0 place-items-center rounded-lg ring-1 ${accents[tone]}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </AdminCard>
  )
}

function Sidebar({ user }: { user: DashboardUser }) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-olive-950/10 bg-white/60 px-4 py-5 dark:border-white/10 dark:bg-black/20 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
      <Link href="/admin" className="flex items-center gap-3 px-2">
        <div className="grid size-10 place-items-center rounded-lg bg-olive-950 text-white dark:bg-olive-300 dark:text-olive-950">
          <ShieldExclamationIcon className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-olive-950 dark:text-white">SideHustleOS</p>
          <p className="text-xs text-olive-700 dark:text-olive-300">Admin Control Plane</p>
        </div>
      </Link>

      <nav className="mt-8 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <a key={item.href} href={item.href} className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-olive-700 transition hover:bg-olive-950/[0.06] hover:text-olive-950 dark:text-olive-300 dark:hover:bg-white/[0.06] dark:hover:text-white">
              <Icon className="size-4" />
              {item.label}
            </a>
          )
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-olive-950/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.05]">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-olive-950 text-xs font-semibold text-white dark:bg-olive-300 dark:text-olive-950">{initials(user.name, user.email)}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-olive-950 dark:text-white">{user.name}</p>
            <p className="truncate text-xs text-olive-700 dark:text-olive-300">{user.email}</p>
          </div>
        </div>
        <Link href="/logout" className="mt-3 flex h-9 items-center justify-center gap-2 rounded-md bg-olive-950 px-3 text-sm font-medium text-white dark:bg-olive-300 dark:text-olive-950">
          <LockOpenIcon className="size-4" />
          Log out
        </Link>
      </div>
    </aside>
  )
}

export function AdminDashboardPage({
  user,
  currentUserId,
  data,
  query,
}: {
  user: DashboardUser
  currentUserId: string
  data: AdminDashboardData
  query: AdminDashboardQuery
}) {
  const riskCount = data.stats.users.suspended + data.stats.users.banned + data.disputes.pagination.total
  const paidRate = data.stats.users.total ? Math.round((data.stats.users.paid / data.stats.users.total) * 100) : 0

  return (
    <main className="min-h-dvh bg-olive-100 text-olive-950 dark:bg-olive-950 dark:text-white">
      <div className="flex min-h-dvh">
        <Sidebar user={user} />
        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <header className="flex flex-col gap-4 border-b border-olive-950/10 pb-5 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-olive-700 dark:text-olive-300">
                  <ShieldExclamationIcon className="size-4" />
                  <span>Admin</span>
                  <span>/</span>
                  <span>Platform</span>
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-normal text-olive-950 dark:text-white">Platform Operations</h1>
                <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">Users, agents, revenue, disputes, broadcasts, and system health in one control view.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StatusPill tone={statusTone(data.health.status)}>System {data.health.status}</StatusPill>
                <Link href="/" className="rounded-md border border-olive-950/10 bg-white/70 px-3 py-2 text-sm font-medium text-olive-800 dark:border-white/10 dark:bg-white/[0.06] dark:text-olive-200">
                  User workspace
                </Link>
                <Link href="/api/v1/admin/health" className="rounded-md bg-olive-950 px-3 py-2 text-sm font-medium text-white dark:bg-olive-300 dark:text-olive-950">
                  Health JSON
                </Link>
              </div>
            </header>

            <section id="overview" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total Users" value={String(data.stats.users.total)} detail={`${paidRate}% paid conversion`} icon={User2Icon} tone="neutral" />
              <MetricCard label="Collected Revenue" value={currency(data.stats.revenue.collected)} detail={`${currency(data.stats.revenue.outstanding)} outstanding`} icon={BanknotesIcon} tone="good" />
              <MetricCard label="Running Agents" value={String(data.stats.operations.runningAgents)} detail={`${data.stats.operations.activeHustles} active hustles`} icon={SparklesIcon} tone="neutral" />
              <MetricCard label="Risk Queue" value={String(riskCount)} detail={`${data.disputes.pagination.total} disputes, ${data.stats.users.suspended} suspended`} icon={ShieldExclamationIcon} tone={riskCount ? 'warning' : 'good'} />
            </section>

            <section className="mt-4 grid gap-4 lg:grid-cols-4">
              <AdminCard className="p-4 sm:p-5">
                <p className="text-sm font-medium text-olive-700 dark:text-olive-300">Paid users</p>
                <p className="mt-2 text-xl font-semibold text-olive-950 dark:text-white">{data.stats.users.paid}</p>
                <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">{data.stats.users.free} free accounts</p>
              </AdminCard>
              <AdminCard className="p-4 sm:p-5">
                <p className="text-sm font-medium text-olive-700 dark:text-olive-300">Clients tracked</p>
                <p className="mt-2 text-xl font-semibold text-olive-950 dark:text-white">{data.stats.operations.clients}</p>
                <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">Across active workspaces</p>
              </AdminCard>
              <AdminCard className="p-4 sm:p-5">
                <p className="text-sm font-medium text-olive-700 dark:text-olive-300">Opportunities</p>
                <p className="mt-2 text-xl font-semibold text-olive-950 dark:text-white">{data.stats.operations.opportunities}</p>
                <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">Visible pipeline items</p>
              </AdminCard>
              <AdminCard className="p-4 sm:p-5">
                <p className="text-sm font-medium text-olive-700 dark:text-olive-300">Moderation flags</p>
                <p className="mt-2 text-xl font-semibold text-olive-950 dark:text-white">{data.stats.users.suspended + data.stats.users.banned}</p>
                <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">{data.stats.users.banned} banned accounts</p>
              </AdminCard>
            </section>

            <section className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
              <AdminCard id="users" className="overflow-hidden">
                <SectionHeader
                  title="User Operations"
                  detail="Recent accounts, plans, roles, and moderation status."
                  action={<StatusPill tone={data.stats.users.suspended ? 'warning' : 'good'}>{data.stats.users.suspended} suspended</StatusPill>}
                />
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-olive-950/10 text-xs uppercase tracking-wide text-olive-600 dark:border-white/10 dark:text-olive-400">
                      <tr>
                        <th className="px-4 py-3 font-medium sm:px-5">User</th>
                        <th className="px-4 py-3 font-medium sm:px-5">Plan</th>
                        <th className="px-4 py-3 font-medium sm:px-5">Role</th>
                        <th className="px-4 py-3 font-medium sm:px-5">Status</th>
                        <th className="px-4 py-3 font-medium sm:px-5">Created</th>
                        <th className="px-4 py-3 font-medium sm:px-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-olive-950/10 dark:divide-white/10">
                      {data.users.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-4 sm:px-5">
                            <div className="flex items-center gap-3">
                              <span className="grid size-8 place-items-center rounded-full bg-olive-950/5 text-xs font-semibold text-olive-800 dark:bg-white/10 dark:text-olive-200">{initials(item.name, item.email)}</span>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-olive-950 dark:text-white">{item.name}</p>
                                <p className="truncate text-xs text-olive-700 dark:text-olive-300">{item.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-olive-700 dark:text-olive-300 sm:px-5">{formatPlan(item.plan)}</td>
                          <td className="px-4 py-4 text-olive-700 dark:text-olive-300 sm:px-5">{item.role}</td>
                          <td className="px-4 py-4 sm:px-5"><StatusPill tone={statusTone(item.adminStatus)}>{item.adminStatus}</StatusPill></td>
                          <td className="px-4 py-4 text-olive-700 dark:text-olive-300 sm:px-5">{formatDate(item.createdAt)}</td>
                          <td className="px-4 py-4 sm:px-5">
                            <AdminUserControls item={item} currentUserId={currentUserId} />
                          </td>
                        </tr>
                      ))}
                      {!data.users.items.length ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-5 text-sm text-olive-700 dark:text-olive-300 sm:px-5">
                            No users match the current admin view.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <PaginationControls pagination={data.users.pagination} query={query} pageKey="usersPage" hash="#users" />
              </AdminCard>

              <div id="system" className="grid gap-4">
                <AdminCard className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-olive-950 dark:text-white">System Health</h2>
                      <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">Checked {formatDate(data.health.checkedAt)}</p>
                    </div>
                    <StatusPill tone={statusTone(data.health.status)}>{data.health.status}</StatusPill>
                  </div>
                  <div className="mt-4 space-y-2">
                    {data.health.services.map((service) => (
                      <div key={service.name} className="flex items-center justify-between rounded-md bg-white/60 p-3 text-sm dark:bg-white/[0.035]">
                        <span className="text-olive-800 dark:text-olive-200">{service.name}</span>
                        <span className="font-medium text-olive-950 dark:text-white">{service.records ?? service.status}</span>
                      </div>
                    ))}
                  </div>
                </AdminCard>

                <AdminCard className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-olive-950 dark:text-white">Broadcasts</h2>
                      <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">Recent admin messages</p>
                    </div>
                    <BellIcon className="size-5 text-olive-800 dark:text-olive-200" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {data.broadcasts.items.length ? data.broadcasts.items.map((broadcast) => (
                      <div key={broadcast.id} className="rounded-md bg-white/60 p-3 text-sm dark:bg-white/[0.035]">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-olive-950 dark:text-white">{broadcast.title}</p>
                          <StatusPill>{broadcast.audience}</StatusPill>
                        </div>
                        <p className="mt-1 text-olive-700 dark:text-olive-300">{broadcast.deliveredCount} delivered</p>
                      </div>
                    )) : <p className="text-sm text-olive-700 dark:text-olive-300">No broadcasts sent yet.</p>}
                  </div>
                  <BroadcastForm />
                  <PaginationControls pagination={data.broadcasts.pagination} query={query} pageKey="broadcastsPage" hash="#system" />
                </AdminCard>
              </div>
            </section>

            <section id="operations" className="mt-5 grid gap-4 xl:grid-cols-2">
              <AdminCard className="overflow-hidden">
                <SectionHeader title="Agent Operations" detail="Running automations and pending human gates." action={<StatusPill>{data.runningAgents.pagination.total} running</StatusPill>} />
                <div className="divide-y divide-olive-950/10 dark:divide-white/10">
                  {data.runningAgents.items.length ? data.runningAgents.items.map((agent) => (
                    <div key={agent.id} className="grid gap-3 p-4 sm:grid-cols-[1.2fr_0.7fr_0.5fr_0.7fr] sm:items-center sm:p-5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-olive-950 dark:text-white">{agent.name}</p>
                        <p className="truncate text-xs text-olive-700 dark:text-olive-300">{agent.type.replaceAll('_', ' ')}</p>
                      </div>
                      <StatusPill tone={statusTone(agent.status)}>{agent.status}</StatusPill>
                      <p className="text-sm text-olive-700 dark:text-olive-300">{agent.runsToday} runs</p>
                      <p className="text-sm text-olive-700 dark:text-olive-300">{agent.approvalsPending} approvals</p>
                    </div>
                  )) : <div className="p-5 text-sm text-olive-700 dark:text-olive-300">No agents are currently running.</div>}
                </div>
                <PaginationControls pagination={data.runningAgents.pagination} query={query} pageKey="agentsPage" hash="#operations" />
              </AdminCard>

              <AdminCard className="overflow-hidden">
                <SectionHeader title="Agent Logs" detail="Latest execution evidence across platform agents." action={<ClipboardIcon className="size-5 text-olive-800 dark:text-olive-200" />} />
                <div className="divide-y divide-olive-950/10 dark:divide-white/10">
                  {data.agentLogs.items.length ? data.agentLogs.items.map((log) => (
                    <div key={log.id} className="p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-olive-950 dark:text-white">{log.message}</p>
                        <StatusPill tone={statusTone(log.level)}>{log.level}</StatusPill>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-olive-700 dark:text-olive-300">{log.evidence}</p>
                      <p className="mt-2 text-xs text-olive-600 dark:text-olive-400">{formatDate(log.createdAt)}</p>
                    </div>
                  )) : <div className="p-5 text-sm text-olive-700 dark:text-olive-300">No agent logs available yet.</div>}
                </div>
                <PaginationControls pagination={data.agentLogs.pagination} query={query} pageKey="logsPage" hash="#operations" />
              </AdminCard>
            </section>

            <section id="risk" className="mt-5">
              <AdminCard className="overflow-hidden">
                <SectionHeader title="Dispute Queue" detail="Open disputes requiring platform intervention." action={<StatusPill tone={data.disputes.pagination.total ? 'warning' : 'good'}>{data.disputes.pagination.total} open</StatusPill>} />
                <div className="divide-y divide-olive-950/10 dark:divide-white/10">
                  {data.disputes.items.length ? data.disputes.items.map((dispute) => (
                    <div key={dispute.id} className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[0.8fr_1.2fr] xl:items-center">
                      <div className="grid gap-3 sm:grid-cols-[1.4fr_0.5fr_0.5fr_0.7fr] sm:items-center">
                        <p className="font-medium text-olive-950 dark:text-white">{dispute.title}</p>
                        <p className="text-sm text-olive-700 dark:text-olive-300">{currency(dispute.amount)}</p>
                        <StatusPill tone={statusTone(dispute.status)}>{dispute.status}</StatusPill>
                        <p className="text-sm text-olive-700 dark:text-olive-300">{formatDate(dispute.createdAt)}</p>
                      </div>
                      <DisputeOverrideForm dispute={dispute} />
                    </div>
                  )) : <div className="p-5 text-sm text-olive-700 dark:text-olive-300">No open disputes.</div>}
                </div>
                <PaginationControls pagination={data.disputes.pagination} query={query} pageKey="disputesPage" hash="#risk" />
              </AdminCard>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
