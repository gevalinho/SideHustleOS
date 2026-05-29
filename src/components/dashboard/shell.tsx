'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType, ReactNode, SVGProps } from 'react'

import { ArrowNarrowRightIcon } from '@/components/icons/arrow-narrow-right-icon'
import { BanknotesIcon } from '@/components/icons/banknotes-icon'
import { BellIcon } from '@/components/icons/bell-icon'
import { BriefcaseIcon } from '@/components/icons/briefcase-icon'
import { CalendarIcon } from '@/components/icons/calendar-icon'
import { ChartLineIcon } from '@/components/icons/chart-line-icon'
import { ClipboardIcon } from '@/components/icons/clipboard-icon'
import { CogIcon } from '@/components/icons/cog-icon'
import { HomeIcon } from '@/components/icons/home-icon'
import { MagnifyingGlassIcon } from '@/components/icons/magnifying-glass-icon'
import { MoonIcon } from '@/components/icons/moon-icon'
import { PaperclipIcon } from '@/components/icons/paperclip-icon'
import { RocketIcon } from '@/components/icons/rocket-icon'
import { SparklesIcon } from '@/components/icons/sparkles-icon'
import { SunIcon } from '@/components/icons/sun-icon'
import { TargetIcon } from '@/components/icons/target-icon'
import { User2Icon } from '@/components/icons/user-2-icon'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

const navItems: { name: string; href: string; icon: Icon }[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Hustles', href: '/hustles', icon: BriefcaseIcon },
  { name: 'AI Agents', href: '/ai-agents', icon: SparklesIcon },
  { name: 'Tasks', href: '/tasks', icon: ClipboardIcon },
  { name: 'Clients', href: '/clients', icon: User2Icon },
  { name: 'Earnings', href: '/earnings', icon: BanknotesIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartLineIcon },
  { name: 'Opportunities', href: '/opportunities', icon: TargetIcon },
  { name: 'Integrations', href: '/integrations', icon: PaperclipIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

export function colorClasses(color: string) {
  const colors: Record<string, { bg: string; text: string; ring: string; glow: string }> = {
    amber: { bg: 'bg-amber-400/15', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-300/20', glow: 'shadow-amber-500/10' },
    blue: { bg: 'bg-blue-500/15', text: 'text-blue-700 dark:text-blue-300', ring: 'ring-blue-300/20', glow: 'shadow-blue-500/10' },
    cyan: { bg: 'bg-cyan-400/15', text: 'text-cyan-700 dark:text-cyan-300', ring: 'ring-cyan-300/20', glow: 'shadow-cyan-500/10' },
    emerald: { bg: 'bg-emerald-400/15', text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-300/20', glow: 'shadow-emerald-500/10' },
    orange: { bg: 'bg-orange-400/15', text: 'text-orange-700 dark:text-orange-300', ring: 'ring-orange-300/20', glow: 'shadow-orange-500/10' },
    pink: { bg: 'bg-pink-500/15', text: 'text-pink-700 dark:text-pink-300', ring: 'ring-pink-300/20', glow: 'shadow-pink-500/10' },
    rose: { bg: 'bg-rose-500/15', text: 'text-rose-700 dark:text-rose-300', ring: 'ring-rose-300/20', glow: 'shadow-rose-500/10' },
  }

  return colors[color] ?? colors.blue
}

export function Card({ children, className = '', as = 'section' }: { children: ReactNode; className?: string; as?: 'div' | 'section' }) {
  const Component = as

  return (
    <Component
      className={`rounded-lg border border-olive-950/10 bg-white/80 shadow-2xl shadow-olive-950/5 ring-1 ring-white/60 backdrop-blur dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 dark:ring-white/[0.03] ${className}`}
    >
      {children}
    </Component>
  )
}

export function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 180
      const y = 44 - ((value - min) / (max - min || 1)) * 34
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg className={`h-12 w-full ${colorClasses(color).text}`} viewBox="0 0 180 48" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M0 48 L ${points.replaceAll(' ', ' L ')} L 180 48 Z`} fill="currentColor" opacity="0.08" />
    </svg>
  )
}

function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 shrink-0 overflow-hidden border-r border-olive-950/10 bg-white/55 px-4 py-6 dark:border-white/10 dark:bg-black/20 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
      <Link href="/" className="flex shrink-0 items-center gap-3 px-2">
        <div className="grid size-9 place-items-center rounded-lg bg-sky-600 text-white shadow-lg shadow-sky-500/15">
          <SparklesIcon className="size-5" />
        </div>
        <div className="text-xl font-semibold tracking-normal text-olive-950 dark:text-white">
          SideHustle<span className="text-sky-600 dark:text-sky-300">OS</span>
        </div>
      </Link>

      <nav className="mt-10 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 [scrollbar-color:rgba(139,92,246,0.45)_transparent] [scrollbar-width:thin]">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                active
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/15'
                  : 'text-olive-700 hover:bg-olive-950/[0.06] hover:text-olive-950 dark:text-olive-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
              }`}
            >
              <Icon className="size-4" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-6 shrink-0 space-y-4">
        <div className="rounded-lg border border-sky-300/50 bg-sky-50/90 p-4 shadow-sm shadow-sky-900/5 ring-1 ring-white/70 dark:border-sky-300/20 dark:bg-sky-500/10 dark:shadow-none dark:ring-white/5">
          <RocketIcon className="size-5 text-sky-700 dark:text-sky-200" />
          <p className="mt-3 font-medium text-sky-950 dark:text-sky-100">Upgrade to Pro</p>
          <p className="mt-2 text-sm leading-6 text-olive-700 dark:text-olive-300">
            Unlock advanced AI agents, analytics, and outreach volume.
          </p>
          <button className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-sky-700 px-3 text-sm font-medium text-white ring-1 ring-sky-200/25 transition hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500">
            Upgrade Now <ArrowNarrowRightIcon className="size-3" />
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-olive-950/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.035]">
          <Image src="/img/avatars/12-size-160.webp" alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-olive-950 dark:text-white">Arjun Verma</p>
            <p className="text-xs text-olive-600 dark:text-olive-300">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <Link href="/" className="flex items-center gap-3 lg:hidden">
          <div className="grid size-9 place-items-center rounded-lg bg-sky-600 text-white">
            <SparklesIcon className="size-5" />
          </div>
          <p className="text-xl font-semibold text-olive-950 dark:text-white">
            SideHustle<span className="text-sky-600 dark:text-sky-300">OS</span>
          </p>
        </Link>
        <h1 className="mt-5 text-2xl font-semibold tracking-normal text-olive-950 dark:text-white lg:mt-0">{title}</h1>
        <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
        <div className="flex h-10 w-full items-center gap-3 rounded-lg border border-olive-950/10 bg-white/70 px-3 text-sm text-olive-600 dark:border-white/10 dark:bg-black/20 dark:text-olive-300 sm:w-80">
          <MagnifyingGlassIcon className="size-4" />
          <span className="min-w-0 flex-1 truncate">Search anything...</span>
          <kbd className="rounded bg-olive-950/5 px-2 py-1 text-xs text-olive-500 dark:bg-white/5 dark:text-olive-400">⌘K</kbd>
          <ThemeToggle />
          <BellIcon className="size-4 text-olive-950 dark:text-white" />
          <Image src="/img/avatars/13-size-160.webp" alt="" width={32} height={32} className="size-8 rounded-full object-cover" />
        </div>
        <button className="flex h-9 w-fit items-center gap-2 rounded-md border border-olive-950/10 bg-white/60 px-3 text-sm text-olive-950 dark:border-white/10 dark:bg-white/[0.035] dark:text-white">
          <CalendarIcon className="size-4 text-olive-300" />
          May 18 - May 24, 2024
        </button>
      </div>
    </header>
  )
}

function ThemeToggle() {
  function toggleTheme() {
    const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    localStorage.setItem('sidehustleos-theme', nextTheme)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title="Toggle theme"
      className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-md border border-olive-950/10 bg-olive-950/[0.04] text-olive-700 transition hover:bg-olive-950/[0.08] hover:text-olive-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-olive-200 dark:hover:bg-white/[0.08] dark:hover:text-white"
    >
      <SunIcon className="absolute size-4 opacity-0 dark:opacity-100" />
      <MoonIcon className="absolute size-4 opacity-100 dark:opacity-0" />
    </button>
  )
}

export function DashboardShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-olive-100 text-olive-950 dark:bg-[#07111d] dark:text-white">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_32rem),radial-gradient(circle_at_top_right,rgba(20,184,166,0.10),transparent_30rem)] dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_32rem),radial-gradient(circle_at_top_right,rgba(20,184,166,0.10),transparent_30rem)]" />
      <div className="relative z-10 flex min-h-dvh">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <Header title={title} subtitle={subtitle} />
            {children}
          </div>
        </div>
      </div>
    </main>
  )
}
