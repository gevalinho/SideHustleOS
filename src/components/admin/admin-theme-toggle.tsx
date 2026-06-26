'use client'

import { MoonIcon } from '@/components/icons/moon-icon'
import { SunIcon } from '@/components/icons/sun-icon'

export function AdminThemeToggle() {
  function toggleTheme() {
    const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    localStorage.setItem('sidehustleos-theme', nextTheme)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border border-olive-950/10 bg-white/70 text-olive-700 transition hover:bg-white hover:text-olive-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-olive-200 dark:hover:bg-white/[0.1] dark:hover:text-white"
    >
      <SunIcon className="absolute size-4 opacity-0 dark:opacity-100" />
      <MoonIcon className="absolute size-4 opacity-100 dark:opacity-0" />
    </button>
  )
}
