import Link from 'next/link'
import type { ReactNode } from 'react'

import { SparklesIcon } from '@/components/icons/sparkles-icon'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <main className="min-h-dvh bg-olive-100 text-olive-950 dark:bg-olive-950 dark:text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-6 py-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-olive-950 text-white shadow-lg shadow-olive-950/10 dark:bg-olive-300 dark:text-olive-950">
              <SparklesIcon className="size-5" />
            </span>
            <span className="text-xl font-semibold">
              SideHustle<span className="text-olive-500 dark:text-olive-300">OS</span>
            </span>
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.9fr_1fr]">
          <section className="max-w-xl">
            <p className="inline-flex rounded-full border border-olive-950/10 bg-white/70 px-3 py-1 text-sm font-medium text-olive-700 dark:border-white/10 dark:bg-white/10 dark:text-olive-200">
              AI business operating system
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-normal text-olive-950 sm:text-5xl dark:text-white">
              {title}
            </h1>
            <p className="mt-5 text-base leading-7 text-olive-700 dark:text-olive-300">{subtitle}</p>
            <div className="mt-8 grid gap-3 text-sm text-olive-700 sm:grid-cols-3 dark:text-olive-300">
              {['Launch faster', 'Automate follow-up', 'Track revenue'].map((item) => (
                <div key={item} className="rounded-lg border border-olive-950/10 bg-white/65 px-4 py-3 dark:border-white/10 dark:bg-white/[0.045]">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-md rounded-lg border border-olive-950/10 bg-white/85 p-5 shadow-xl shadow-olive-950/5 ring-1 ring-white/70 sm:p-6 dark:border-white/10 dark:bg-white/[0.055] dark:ring-white/[0.03]">
            {children}
            <div className="mt-6 border-t border-olive-950/10 pt-5 text-center text-sm text-olive-700 dark:border-white/10 dark:text-olive-300">
              {footer}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

