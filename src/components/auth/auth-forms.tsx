'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type ApiResponse<T = unknown> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: {
        code: string
        message: string
      }
    }

type AuthPayload = {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    name: string
    email: string
    role: 'user' | 'admin'
  }
}

type FormState = {
  error: string
  success: string
  isSubmitting: boolean
}

const initialState: FormState = {
  error: '',
  success: '',
  isSubmitting: false,
}

function safeReturnTo(returnTo?: string) {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/'
  }

  return returnTo
}

async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`/api/v1/auth${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  const json = (await response.json()) as ApiResponse<T>

  if (!response.ok || !json.success) {
    throw new Error(json.success ? 'Something went wrong.' : json.error.message)
  }

  return json.data
}

function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  required = true,
  minLength,
  placeholder,
  inputMode,
  defaultValue,
}: {
  label: string
  name: string
  type?: string
  autoComplete?: string
  required?: boolean
  minLength?: number
  placeholder?: string
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
  defaultValue?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-olive-800 dark:text-olive-200">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        inputMode={inputMode}
        defaultValue={defaultValue}
        className="mt-2 h-11 w-full rounded-md border border-olive-950/10 bg-white px-3 text-sm text-olive-950 outline-none ring-0 transition placeholder:text-olive-400 focus:border-olive-600 focus:ring-2 focus:ring-olive-600/20 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-olive-500 dark:focus:border-olive-300 dark:focus:ring-olive-300/20"
      />
    </label>
  )
}

function SubmitButton({ children, isSubmitting }: { children: string; isSubmitting: boolean }) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="inline-flex h-11 w-full items-center justify-center rounded-md bg-olive-950 px-4 text-sm font-semibold text-white transition hover:bg-olive-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-olive-300 dark:text-olive-950 dark:hover:bg-olive-200"
    >
      {isSubmitting ? 'Please wait...' : children}
    </button>
  )
}

function FormMessage({ error, success }: { error: string; success: string }) {
  if (!error && !success) {
    return null
  }

  return (
    <div
      role="status"
      className={`rounded-md border px-3 py-2 text-sm ${
        error
          ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-200'
          : 'border-olive-950/10 bg-olive-950/5 text-olive-800 dark:border-white/10 dark:bg-white/10 dark:text-olive-200'
      }`}
    >
      {error || success}
    </div>
  )
}

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const router = useRouter()
  const [state, setState] = useState(initialState)
  const destination = useMemo(() => safeReturnTo(returnTo), [returnTo])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    setState({ ...initialState, isSubmitting: true })

    try {
      const payload = await apiRequest<AuthPayload>('/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
          totpCode: form.get('totpCode') || undefined,
        }),
      })
      router.replace(payload.user.role === 'admin' && destination === '/' ? '/admin' : destination)
      router.refresh()
    } catch (error) {
      setState({ error: error instanceof Error ? error.message : 'Unable to sign in.', success: '', isSubmitting: false })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" placeholder="arjun@example.com" />
      <Field label="Password" name="password" type="password" autoComplete="current-password" minLength={8} />
      <Field label="2FA code" name="totpCode" inputMode="numeric" required={false} placeholder="Optional" />
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton isSubmitting={state.isSubmitting}>Sign in</SubmitButton>
      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="font-medium text-olive-800 hover:text-olive-950 dark:text-olive-200 dark:hover:text-white">
          Forgot password?
        </Link>
        <Link href="/register" className="font-medium text-olive-800 hover:text-olive-950 dark:text-olive-200 dark:hover:text-white">
          Create account
        </Link>
      </div>
    </form>
  )
}

export function RegisterForm({ returnTo }: { returnTo?: string }) {
  const router = useRouter()
  const [state, setState] = useState(initialState)
  const destination = useMemo(() => safeReturnTo(returnTo), [returnTo])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    const confirmPassword = String(form.get('confirmPassword') ?? '')

    if (password !== confirmPassword) {
      setState({ error: 'Passwords do not match.', success: '', isSubmitting: false })
      return
    }

    setState({ ...initialState, isSubmitting: true })

    try {
      await apiRequest<AuthPayload>('/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          password,
        }),
      })
      router.replace(destination)
      router.refresh()
    } catch (error) {
      setState({ error: error instanceof Error ? error.message : 'Unable to create account.', success: '', isSubmitting: false })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Full name" name="name" autoComplete="name" placeholder="Arjun Verma" />
      <Field label="Email" name="email" type="email" autoComplete="email" placeholder="arjun@example.com" />
      <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={8} />
      <Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} />
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton isSubmitting={state.isSubmitting}>Create account</SubmitButton>
    </form>
  )
}

export function ForgotPasswordForm() {
  const [state, setState] = useState(initialState)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    setState({ ...initialState, isSubmitting: true })

    try {
      await apiRequest('/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email') }),
      })
      setState({ error: '', success: 'If the account exists, reset instructions have been sent.', isSubmitting: false })
    } catch (error) {
      setState({ error: error instanceof Error ? error.message : 'Unable to request reset.', success: '', isSubmitting: false })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" placeholder="arjun@example.com" />
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton isSubmitting={state.isSubmitting}>Send reset link</SubmitButton>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter()
  const [state, setState] = useState(initialState)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const newPassword = String(form.get('newPassword') ?? '')
    const confirmPassword = String(form.get('confirmPassword') ?? '')

    if (newPassword !== confirmPassword) {
      setState({ error: 'Passwords do not match.', success: '', isSubmitting: false })
      return
    }

    setState({ ...initialState, isSubmitting: true })

    try {
      await apiRequest('/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: form.get('token'),
          newPassword,
        }),
      })
      setState({ error: '', success: 'Password reset. Redirecting to sign in...', isSubmitting: false })
      setTimeout(() => router.replace('/login'), 800)
    } catch (error) {
      setState({ error: error instanceof Error ? error.message : 'Unable to reset password.', success: '', isSubmitting: false })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Reset token" name="token" autoComplete="one-time-code" defaultValue={token} placeholder="Paste token from email" />
      <Field label="New password" name="newPassword" type="password" autoComplete="new-password" minLength={8} />
      <Field label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} />
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton isSubmitting={state.isSubmitting}>Reset password</SubmitButton>
    </form>
  )
}

export function VerifyEmailForm({ token }: { token?: string }) {
  const [state, setState] = useState(initialState)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    setState({ ...initialState, isSubmitting: true })

    try {
      await apiRequest('/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: form.get('token') }),
      })
      setState({ error: '', success: 'Email verified.', isSubmitting: false })
    } catch (error) {
      setState({ error: error instanceof Error ? error.message : 'Unable to verify email.', success: '', isSubmitting: false })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Verification token" name="token" autoComplete="one-time-code" defaultValue={token} placeholder="Paste token from email" />
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton isSubmitting={state.isSubmitting}>Verify email</SubmitButton>
    </form>
  )
}
