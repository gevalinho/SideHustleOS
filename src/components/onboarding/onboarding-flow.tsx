'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { ArrowNarrowRightIcon } from '@/components/icons/arrow-narrow-right-icon'
import { CheckmarkIcon } from '@/components/icons/checkmark-icon'
import { MailIcon } from '@/components/icons/mail-icon'
import { RocketIcon } from '@/components/icons/rocket-icon'
import { SparklesIcon } from '@/components/icons/sparkles-icon'
import { TargetIcon } from '@/components/icons/target-icon'

type BusinessOption = {
  index: number
  name: string
  skill: string
  customerProfile: string
  offer: string
  pricing: string
  confidence: 'high' | 'medium'
  estimatedTimeToFirstDollar: string
  firstActions: string[]
}

export type OnboardingFlowState = {
  currentStep: number
  completedSteps: number[]
  extractedSkills: string[]
  businessOptions: BusinessOption[]
  selectedBusiness: BusinessOption | null
  hustleId: string | null
  gmailConnected: boolean
  completed: boolean
}

type SampleEmail = {
  subject: string
  previewText: string
  body: string
}

type PaywallPlan = {
  id: string
  name: string
  price: number
  interval: string
  includedProspects: number
  includedEmails: number
  features: string[]
}

type PaywallData = {
  recommendedPlan: string
  currency: string
  plans: PaywallPlan[]
}

type GmailConnectData = {
  oauthUrl: string
  provider: string
  scopes: string[]
}

type ApiResponse<T> =
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

async function apiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api/v1/onboarding${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  const json = (await response.json()) as ApiResponse<T>

  if (!response.ok || !json.success) {
    throw new Error(json.success ? 'Something went wrong.' : json.error.message)
  }

  return json.data
}

function StepMarker({ number, active, done }: { number: number; active: boolean; done: boolean }) {
  return (
    <span
      className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
        done
          ? 'bg-olive-950 text-white dark:bg-olive-300 dark:text-olive-950'
          : active
            ? 'bg-olive-950/10 text-olive-950 ring-1 ring-olive-950/15 dark:bg-white/10 dark:text-white dark:ring-white/15'
            : 'bg-white/70 text-olive-500 ring-1 ring-olive-950/10 dark:bg-white/[0.04] dark:text-olive-400 dark:ring-white/10'
      }`}
    >
      {done ? <CheckmarkIcon className="size-4" /> : number}
    </span>
  )
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-lg border border-olive-950/10 bg-white/80 p-4 shadow-xl shadow-olive-950/5 ring-1 ring-white/70 sm:p-5 dark:border-white/10 dark:bg-white/[0.045] dark:ring-white/[0.03] ${className}`}
    >
      {children}
    </section>
  )
}

export function OnboardingFlow({ userName, initialState }: { userName: string; initialState: OnboardingFlowState }) {
  const [state, setState] = useState<OnboardingFlowState>(initialState)
  const [sampleEmail, setSampleEmail] = useState<SampleEmail | null>(null)
  const [paywall, setPaywall] = useState<PaywallData | null>(null)
  const [gmailConnect, setGmailConnect] = useState<GmailConnectData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const activeStep = useMemo(() => {
    if (!state.extractedSkills.length) return 2
    if (!state.selectedBusiness) return 3
    if (!sampleEmail) return 7
    return 8
  }, [sampleEmail, state])

  async function refreshState() {
    const nextState = await apiRequest<OnboardingFlowState>('/state')
    setState(nextState)
  }

  async function submitSkills(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const text = String(form.get('skills') ?? '').trim()

    if (!text) {
      setError('Tell us a little about your skills before continuing.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const data = await apiRequest<{ state: OnboardingFlowState }>('/skills', {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
      setState(data.state)
      setSampleEmail(null)
      setPaywall(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to submit skills.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function selectBusiness(index: number) {
    setError('')
    setIsSubmitting(true)

    try {
      const data = await apiRequest<{ state: OnboardingFlowState }>('/business/select', {
        method: 'POST',
        body: JSON.stringify({ index }),
      })
      setState(data.state)
      setSampleEmail(null)
      setPaywall(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to select business.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function loadSampleEmail() {
    setError('')
    setIsSubmitting(true)

    try {
      const email = await apiRequest<SampleEmail>('/sample-email')
      setSampleEmail(email)
      await refreshState()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load sample email.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function loadGmailConnectUrl() {
    setError('')
    setIsSubmitting(true)

    try {
      const data = await apiRequest<GmailConnectData>('/gmail/connect-url')
      setGmailConnect(data)
      await refreshState()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load Gmail connection URL.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function loadPaywall() {
    setError('')
    setIsSubmitting(true)

    try {
      const data = await apiRequest<PaywallData>('/paywall')
      setPaywall(data)
      await refreshState()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load plan data.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
      <aside className="h-fit rounded-lg border border-olive-950/10 bg-white/70 p-4 ring-1 ring-white/70 dark:border-white/10 dark:bg-white/[0.04] dark:ring-white/[0.03]">
        <p className="text-sm font-semibold text-olive-950 dark:text-white">Setup progress</p>
        <div className="mt-4 space-y-4">
          {[
            [1, 'Account created'],
            [2, 'Skill profile'],
            [3, 'Business selection'],
            [7, 'Outreach preview'],
            [8, 'Launch plan'],
          ].map(([step, label]) => (
            <div key={step} className="flex items-center gap-3">
              <StepMarker number={Number(step)} active={activeStep === step} done={state.completedSteps.includes(Number(step)) || activeStep > Number(step)} />
              <span className="text-sm text-olive-700 dark:text-olive-300">{label}</span>
            </div>
          ))}
        </div>
      </aside>

      <div className="space-y-5">
        <Panel>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-olive-950/5 px-3 py-1 text-sm font-medium text-olive-700 ring-1 ring-olive-950/10 dark:bg-white/10 dark:text-olive-200 dark:ring-white/10">
                Welcome, {userName}
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-normal text-olive-950 dark:text-white">Build your first money-making workflow.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-olive-700 dark:text-olive-300">
                Give SideHustleOS a clear skill signal, pick a business direction, preview the outreach, then choose the launch capacity that fits.
              </p>
            </div>
            <Link href="/" className="inline-flex h-10 items-center justify-center rounded-md border border-olive-950/10 bg-white px-3 text-sm font-medium text-olive-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
              Skip to dashboard
            </Link>
          </div>
          {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-200">{error}</p> : null}
        </Panel>

        <Panel>
          <div className="flex items-start gap-3">
            <StepMarker number={2} active={activeStep === 2} done={state.extractedSkills.length > 0} />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-olive-950 dark:text-white">Tell us what you can do</h2>
              <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">Paste your work history, skills, services, or a rough CV summary.</p>
              <form onSubmit={submitSkills} className="mt-4 space-y-3">
                <textarea
                  name="skills"
                  rows={6}
                  defaultValue="I am a senior React developer with 5 years experience. I specialise in building SaaS dashboards and design systems. I also do Figma UI design and can write technical documentation."
                  className="w-full resize-y rounded-md border border-olive-950/10 bg-white px-3 py-2 text-sm leading-6 text-olive-950 outline-none focus:border-olive-600 focus:ring-2 focus:ring-olive-600/20 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
                <button
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-olive-950 px-4 text-sm font-semibold text-white transition hover:bg-olive-800 disabled:opacity-60 dark:bg-olive-300 dark:text-olive-950 dark:hover:bg-olive-200"
                >
                  <SparklesIcon className="size-4" />
                  {state.extractedSkills.length ? 'Regenerate options' : 'Generate business options'}
                </button>
              </form>

              {state.extractedSkills.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {state.extractedSkills.map((skill) => (
                    <span key={skill} className="rounded-full bg-olive-950/5 px-3 py-1 text-sm text-olive-800 ring-1 ring-olive-950/10 dark:bg-white/10 dark:text-olive-200 dark:ring-white/10">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-start gap-3">
            <StepMarker number={3} active={activeStep === 3} done={Boolean(state.selectedBusiness)} />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-olive-950 dark:text-white">Choose a business direction</h2>
              <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">Pick the option you want agents to build around first.</p>
              <div className="mt-4 grid gap-3 xl:grid-cols-3">
                {state.businessOptions.map((option) => {
                  const selected = state.selectedBusiness?.index === option.index
                  return (
                    <button
                      key={option.index}
                      type="button"
                      onClick={() => selectBusiness(option.index)}
                      disabled={isSubmitting}
                      className={`rounded-lg border p-4 text-left transition ${
                        selected
                          ? 'border-olive-950 bg-olive-950 text-white dark:border-olive-300 dark:bg-olive-300 dark:text-olive-950'
                          : 'border-olive-950/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-white/[0.07]'
                      }`}
                    >
                      <TargetIcon className="size-5" />
                      <h3 className="mt-3 font-semibold">{option.name}</h3>
                      <p className={`mt-2 text-sm leading-6 ${selected ? 'text-white/80 dark:text-olive-900' : 'text-olive-700 dark:text-olive-300'}`}>{option.offer}</p>
                      <p className="mt-3 text-sm font-medium">{option.pricing}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-start gap-3">
            <StepMarker number={7} active={activeStep === 7} done={Boolean(sampleEmail)} />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-olive-950 dark:text-white">Preview your first outreach</h2>
              <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">Review the type of email your agent will draft once Gmail is connected.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={loadGmailConnectUrl}
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-olive-950/10 bg-white px-4 text-sm font-medium text-olive-950 disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  <MailIcon className="size-4" />
                  Get Gmail URL
                </button>
                <button
                  type="button"
                  onClick={loadSampleEmail}
                  disabled={isSubmitting || !state.businessOptions.length}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-olive-950 px-4 text-sm font-semibold text-white transition hover:bg-olive-800 disabled:opacity-60 dark:bg-olive-300 dark:text-olive-950 dark:hover:bg-olive-200"
                >
                  Generate sample email
                </button>
              </div>

              {gmailConnect ? (
                <div className="mt-4 rounded-md border border-olive-950/10 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-white/[0.035]">
                  <p className="font-medium text-olive-950 dark:text-white">Gmail connection URL</p>
                  <p className="mt-2 break-all text-olive-700 dark:text-olive-300">{gmailConnect.oauthUrl}</p>
                </div>
              ) : null}

              {sampleEmail ? (
                <div className="mt-4 rounded-lg border border-olive-950/10 bg-white/70 p-4 dark:border-white/10 dark:bg-black/20">
                  <p className="text-sm font-semibold text-olive-950 dark:text-white">{sampleEmail.subject}</p>
                  <p className="mt-1 text-sm text-olive-600 dark:text-olive-400">{sampleEmail.previewText}</p>
                  <pre className="mt-4 whitespace-pre-wrap rounded-md bg-olive-950 p-4 text-sm leading-6 text-olive-100 dark:bg-black/30">{sampleEmail.body}</pre>
                </div>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-start gap-3">
            <StepMarker number={8} active={activeStep === 8} done={Boolean(paywall)} />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-olive-950 dark:text-white">Pick launch capacity</h2>
              <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">Compare the plan limits before turning on more agents and outreach volume.</p>
              <button
                type="button"
                onClick={loadPaywall}
                disabled={isSubmitting}
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-olive-950 px-4 text-sm font-semibold text-white transition hover:bg-olive-800 disabled:opacity-60 dark:bg-olive-300 dark:text-olive-950 dark:hover:bg-olive-200"
              >
                <RocketIcon className="size-4" />
                Show launch plans
              </button>

              {paywall ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {paywall.plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`rounded-lg border p-4 ${
                        plan.id === paywall.recommendedPlan
                          ? 'border-olive-950 bg-olive-950 text-white dark:border-olive-300 dark:bg-olive-300 dark:text-olive-950'
                          : 'border-olive-950/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.035]'
                      }`}
                    >
                      <p className="font-semibold">{plan.name}</p>
                      <p className="mt-2 text-3xl font-semibold">${plan.price}</p>
                      <p className="text-sm opacity-75">per {plan.interval}</p>
                      <ul className="mt-4 space-y-2 text-sm">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex gap-2">
                            <CheckmarkIcon className="mt-1 size-3 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}

              <Link href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-olive-900 dark:text-olive-100">
                Continue to dashboard <ArrowNarrowRightIcon className="size-3" />
              </Link>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
