import { changeBillingPlan, purchaseTopUp, revokeOtherSessions, saveAgentLimits, saveApprovalRules, updateProfile } from '@/app/settings/actions'
import { DashboardShell } from '@/components/dashboard/shell'
import { getBillingStatus, getPricing } from '@/lib/billing-store'
import { getDashboardMenuData } from '@/lib/dashboard-data'
import { requireCompletedOnboarding } from '@/lib/session'
import { getUserSettings } from '@/lib/settings-store'
import { listUserSessions } from '@/lib/auth-store'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatPlan(plan: string) {
  return plan.replaceAll('_', ' ')
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function SettingsCard({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-olive-950/10 bg-white/80 shadow-2xl shadow-olive-950/5 ring-1 ring-white/60 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20 dark:ring-white/[0.03]">
      <div className="border-b border-olive-950/10 p-4 dark:border-white/10 sm:p-5">
        <h2 className="font-semibold text-olive-950 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">{detail}</p>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

function Field({ label, name, defaultValue, type = 'text' }: { label: string; name: string; defaultValue: string | number; type?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-olive-800 dark:text-olive-200">{label}</span>
      <input
        name={name}
        type={type}
        min={type === 'number' ? 0 : undefined}
        defaultValue={defaultValue}
        className="mt-2 h-11 w-full rounded-md border border-olive-950/10 bg-white px-3 text-sm text-olive-950 outline-none focus:border-olive-600 focus:ring-2 focus:ring-olive-600/20 dark:border-white/10 dark:bg-white/10 dark:text-white"
      />
    </label>
  )
}

function SubmitButton({ children }: { children: string }) {
  return <button type="submit" className="h-10 rounded-md bg-olive-950 px-4 text-sm font-semibold text-white dark:bg-olive-300 dark:text-olive-950">{children}</button>
}

export default async function SettingsPage() {
  const accountSession = await requireCompletedOnboarding('/settings')
  const settings = getUserSettings(accountSession.user.id)
  const billing = getBillingStatus(accountSession.user.id)
  const pricing = getPricing()
  const sessions = listUserSessions(accountSession.user.id)

  return (
    <DashboardShell title="Settings" subtitle="Manage account details, agent guardrails, billing, and active sessions." user={accountSession.user} menuData={getDashboardMenuData(accountSession.user.id)}>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <SettingsCard title="Profile" detail="Keep your workspace identity accurate for agent drafts, invoices, and client-facing workflows.">
            <form action={updateProfile} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Full name" name="name" defaultValue={accountSession.user.name} />
              <SubmitButton>Save profile</SubmitButton>
            </form>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-md bg-olive-950/5 p-3 dark:bg-white/[0.04]">
                <p className="text-olive-600 dark:text-olive-400">Email</p>
                <p className="mt-1 font-medium text-olive-950 dark:text-white">{accountSession.user.email}</p>
              </div>
              <div className="rounded-md bg-olive-950/5 p-3 dark:bg-white/[0.04]">
                <p className="text-olive-600 dark:text-olive-400">Gmail</p>
                <p className="mt-1 font-medium text-olive-950 dark:text-white">{accountSession.user.gmailConnected ? 'Connected' : 'Not connected'}</p>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard title="Approval Rules" detail="Choose when agents need human review before sending messages, invoices, or spend.">
            <form action={saveApprovalRules} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-olive-800 dark:text-olive-200">Approval mode</span>
                <select name="mode" defaultValue={settings.approvalRules.mode} className="mt-2 h-11 w-full rounded-md border border-olive-950/10 bg-white px-3 text-sm text-olive-950 outline-none dark:border-white/10 dark:bg-white/10 dark:text-white">
                  <option value="manual">Manual</option>
                  <option value="balanced">Balanced</option>
                  <option value="autopilot">Autopilot</option>
                </select>
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {['replies', 'invoices', 'ad_spend', 'client_followups'].map((item) => (
                  <label key={item} className="flex items-center gap-3 rounded-md border border-olive-950/10 bg-white/60 p-3 text-sm text-olive-800 dark:border-white/10 dark:bg-white/[0.035] dark:text-olive-200">
                    <input name="requireApprovalFor" type="checkbox" value={item} defaultChecked={settings.approvalRules.requireApprovalFor.includes(item)} className="size-4" />
                    {formatPlan(item)}
                  </label>
                ))}
              </div>
              <SubmitButton>Save approval rules</SubmitButton>
            </form>
          </SettingsCard>

          <SettingsCard title="Agent Limits" detail="Control daily outreach, spend exposure, and concurrent automation volume.">
            <form action={saveAgentLimits} className="grid gap-4 sm:grid-cols-3">
              <Field label="Daily email cap" name="dailyEmailCap" type="number" defaultValue={settings.agentLimits.dailyEmailCap} />
              <Field label="Monthly ad spend cap" name="monthlyAdSpendCap" type="number" defaultValue={settings.agentLimits.monthlyAdSpendCap} />
              <Field label="Concurrent agents" name="maxConcurrentAgents" type="number" defaultValue={settings.agentLimits.maxConcurrentAgents} />
              <div className="sm:col-span-3">
                <SubmitButton>Save limits</SubmitButton>
              </div>
            </form>
          </SettingsCard>
        </div>

        <div className="space-y-5">
          <SettingsCard title="Billing" detail="Review current capacity and switch plans when your workflow needs more room.">
            <div className="rounded-md bg-olive-950/5 p-4 dark:bg-white/[0.04]">
              <p className="text-sm text-olive-600 dark:text-olive-400">Current plan</p>
              <p className="mt-1 text-2xl font-semibold capitalize text-olive-950 dark:text-white">{formatPlan(billing.plan.name)}</p>
              <p className="mt-2 text-sm text-olive-700 dark:text-olive-300">
                {billing.included.prospects} prospects, {billing.included.emails} emails, {String(billing.included.maxAgents)} agents.
              </p>
            </div>
            <div className="mt-4 grid gap-3">
              {pricing.plans.filter((plan) => plan.id !== 'free').map((plan) => (
                <form key={plan.id} action={changeBillingPlan} className="flex items-center justify-between gap-3 rounded-md border border-olive-950/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.035]">
                  <input type="hidden" name="plan" value={plan.id} />
                  <div>
                    <p className="font-medium text-olive-950 dark:text-white">{plan.name}</p>
                    <p className="text-sm text-olive-700 dark:text-olive-300">{plan.interval === 'usage' ? 'Usage based' : `${money(plan.price)}/month`}</p>
                  </div>
                  <button type="submit" disabled={billing.account.plan === plan.id} className="h-9 rounded-md border border-olive-950/10 px-3 text-sm font-semibold text-olive-800 disabled:opacity-50 dark:border-white/10 dark:text-olive-200">
                    {billing.account.plan === plan.id ? 'Current' : 'Switch'}
                  </button>
                </form>
              ))}
            </div>
          </SettingsCard>

          <SettingsCard title="Top-Ups" detail="Add capacity without changing the active plan.">
            <div className="grid gap-3">
              {pricing.topUps.map((topUp) => (
                <form key={topUp.key} action={purchaseTopUp} className="flex items-center justify-between gap-3 rounded-md border border-olive-950/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.035]">
                  <input type="hidden" name="topUpKey" value={topUp.key} />
                  <div>
                    <p className="font-medium text-olive-950 dark:text-white">{topUp.name}</p>
                    <p className="text-sm text-olive-700 dark:text-olive-300">{money(topUp.price)}</p>
                  </div>
                  <button type="submit" className="h-9 rounded-md bg-olive-950 px-3 text-sm font-semibold text-white dark:bg-olive-300 dark:text-olive-950">Buy</button>
                </form>
              ))}
            </div>
          </SettingsCard>

          <SettingsCard title="Sessions" detail="Audit active logins and revoke other devices when needed.">
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="rounded-md bg-olive-950/5 p-3 text-sm dark:bg-white/[0.04]">
                  <p className="font-medium text-olive-950 dark:text-white">{session.userAgent}</p>
                  <p className="mt-1 text-olive-700 dark:text-olive-300">{session.ipAddress} · last seen {formatDate(session.lastSeenAt)}</p>
                </div>
              ))}
            </div>
            <form action={revokeOtherSessions} className="mt-4">
              <SubmitButton>Revoke other sessions</SubmitButton>
            </form>
          </SettingsCard>
        </div>
      </div>
    </DashboardShell>
  )
}
