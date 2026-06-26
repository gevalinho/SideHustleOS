import { redirect } from 'next/navigation'

import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { getOnboardingState } from '@/lib/onboarding-store'
import { requireAccountSession } from '@/lib/session'

export const metadata = {
  title: 'Onboarding | SideHustleOS',
}

export default async function OnboardingPage() {
  const accountSession = await requireAccountSession('/onboarding')
  const state = getOnboardingState(accountSession.user.id)

  if (state.completed) {
    redirect('/')
  }

  const selectedBusiness =
    state.selectedBusinessIndex === null
      ? null
      : state.businessOptions.find((option) => option.index === state.selectedBusinessIndex) ?? null

  return (
    <main className="min-h-dvh bg-olive-100 px-4 py-5 text-olive-950 sm:px-6 lg:px-8 dark:bg-olive-950 dark:text-white">
      <div className="mx-auto max-w-7xl">
        <OnboardingFlow
          userName={accountSession.user.name}
          initialState={{
            currentStep: state.currentStep,
            completedSteps: state.completedSteps,
            extractedSkills: state.extractedSkills,
            businessOptions: state.businessOptions,
            selectedBusiness,
            hustleId: state.selectedHustleId,
            gmailConnected: state.gmailConnected,
            completed: state.completed,
          }}
        />
      </div>
    </main>
  )
}
