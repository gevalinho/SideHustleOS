import { NextResponse } from 'next/server'

import { getRequestAuth } from '@/lib/request-auth'
import {
  completeSteps,
  extractSkillsFromText,
  generateBusinessOptions,
  getOnboardingState,
  selectBusiness,
  updateOnboardingState,
} from '@/lib/onboarding-store'

type RouteContext = {
  params: Promise<{
    path?: string[]
  }>
}

type JsonObject = Record<string, unknown>

function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init)
}

function accepted(data: unknown) {
  return ok(data, { status: 202 })
}

function error(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

async function readJson(request: Request): Promise<JsonObject> {
  try {
    return (await request.json()) as JsonObject
  } catch {
    return {}
  }
}

function requireAuth(request: Request) {
  const auth = getRequestAuth(request)

  if (!auth) {
    return { response: error(401, 'UNAUTHORIZED', 'A valid login session is required.') }
  }

  return { auth }
}

function serializeState(userId: string) {
  const state = getOnboardingState(userId)
  const selectedBusiness =
    state.selectedBusinessIndex === null
      ? null
      : state.businessOptions.find((option) => option.index === state.selectedBusinessIndex) ?? null

  return {
    currentStep: state.currentStep,
    completedSteps: state.completedSteps,
    skillSource: state.skillSource,
    extractedSkills: state.extractedSkills,
    businessOptions: state.businessOptions,
    selectedBusiness,
    hustleId: state.selectedHustleId,
    gmailConnected: state.gmailConnected,
    completed: state.completed,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  }
}

function state(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  return ok(serializeState(required.auth.user.id))
}

async function submitSkills(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  const cvBase64 = typeof body.cvBase64 === 'string' ? body.cvBase64.trim() : ''

  if (!text && !cvBase64) {
    return error(400, 'VALIDATION_ERROR', 'Either text or cvBase64 is required.')
  }

  const current = getOnboardingState(required.auth.user.id)
  const extractedSkills = text
    ? extractSkillsFromText(text)
    : ['CV-based service packaging', 'Client-facing delivery', 'Business operations']
  const businessOptions = generateBusinessOptions(extractedSkills)
  const source = text
    ? {
        type: 'text' as const,
        value: text,
      }
    : {
        type: 'cv' as const,
        fileName: 'uploaded-cv.pdf',
        bytesApprox: Math.ceil((cvBase64.length * 3) / 4),
      }

  updateOnboardingState(required.auth.user.id, {
    currentStep: 3,
    completedSteps: completeSteps(current.completedSteps, 2),
    skillSource: source,
    extractedSkills,
    businessOptions,
    selectedBusinessIndex: null,
    selectedHustleId: null,
  })

  return accepted({
    status: 'processing_complete',
    extractedSkills,
    businessOptions,
    state: serializeState(required.auth.user.id),
  })
}

async function selectBusinessOption(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const body = await readJson(request)
  const index = typeof body.index === 'number' ? body.index : Number(body.index)

  if (!Number.isInteger(index) || index < 0) {
    return error(400, 'VALIDATION_ERROR', 'index must be a non-negative integer.')
  }

  const selectedState = selectBusiness(required.auth.user.id, index)

  if (!selectedState) {
    return error(404, 'BUSINESS_OPTION_NOT_FOUND', 'Business option was not found. Submit skills first.')
  }

  const selectedBusiness = selectedState.businessOptions.find((option) => option.index === index)

  return ok({
    hustleId: selectedState.selectedHustleId,
    selectedBusiness,
    state: serializeState(required.auth.user.id),
  })
}

function gmailConnectUrl(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const current = getOnboardingState(required.auth.user.id)
  updateOnboardingState(required.auth.user.id, {
    currentStep: Math.max(current.currentStep, 5),
    completedSteps: completeSteps(current.completedSteps, 4),
  })

  return ok({
    oauthUrl: `${new URL(request.url).origin}/api/v1/auth/gmail/connect?source=onboarding`,
    provider: 'gmail',
    scopes: ['gmail.send', 'gmail.readonly'],
  })
}

function sampleEmail(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const state = getOnboardingState(required.auth.user.id)
  const selectedBusiness =
    state.selectedBusinessIndex === null
      ? state.businessOptions[0]
      : state.businessOptions.find((option) => option.index === state.selectedBusinessIndex)

  if (!selectedBusiness) {
    return error(409, 'BUSINESS_REQUIRED', 'Submit skills before requesting a sample email.')
  }

  updateOnboardingState(required.auth.user.id, {
    currentStep: Math.max(state.currentStep, 7),
    completedSteps: completeSteps(state.completedSteps, 5, 6),
  })

  return ok({
    subject: `Quick idea for your ${selectedBusiness.skill.toLowerCase()} workflow`,
    previewText: `I noticed your team may benefit from ${selectedBusiness.offer.toLowerCase()}.`,
    body: [
      `Hi {{firstName}},`,
      '',
      `I help ${selectedBusiness.customerProfile.toLowerCase()} with ${selectedBusiness.offer.toLowerCase()}`,
      '',
      `The starting package is ${selectedBusiness.pricing}, and most teams can see value in ${selectedBusiness.estimatedTimeToFirstDollar}.`,
      '',
      'Worth a quick look this week?',
      '',
      required.auth.user.name,
    ].join('\n'),
  })
}

function paywall(request: Request) {
  const required = requireAuth(request)

  if ('response' in required) {
    return required.response
  }

  const state = getOnboardingState(required.auth.user.id)
  updateOnboardingState(required.auth.user.id, {
    currentStep: Math.max(state.currentStep, 8),
    completedSteps: completeSteps(state.completedSteps, 7, 8),
    completed: true,
  })

  return ok({
    recommendedPlan: 'starter',
    currency: 'USD',
    plans: [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'month',
        includedProspects: 25,
        includedEmails: 50,
        features: ['One hustle', 'Manual approvals', 'Basic analytics'],
      },
      {
        id: 'starter',
        name: 'Starter',
        price: 19,
        interval: 'month',
        includedProspects: 250,
        includedEmails: 500,
        features: ['Three hustles', 'AI outreach drafts', 'Invoice and chaser tools'],
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 49,
        interval: 'month',
        includedProspects: 1000,
        includedEmails: 2500,
        features: ['Unlimited hustles', 'Advanced agents', 'Revenue analytics'],
      },
    ],
    topUps: [
      { id: 'prospects_50', name: '50 prospects', price: 9 },
      { id: 'prospects_150', name: '150 prospects', price: 24 },
      { id: 'emails_500', name: '500 emails', price: 15 },
      { id: 'vip_onboarding', name: 'VIP onboarding', price: 49 },
    ],
  })
}

async function handle(request: Request, context: RouteContext) {
  const { path = [] } = await context.params
  const route = path.join('/')

  if (request.method === 'GET' && route === 'state') return state(request)
  if (request.method === 'POST' && route === 'skills') return submitSkills(request)
  if (request.method === 'POST' && route === 'business/select') return selectBusinessOption(request)
  if (request.method === 'GET' && route === 'gmail/connect-url') return gmailConnectUrl(request)
  if (request.method === 'GET' && route === 'sample-email') return sampleEmail(request)
  if (request.method === 'GET' && route === 'paywall') return paywall(request)

  return error(404, 'NOT_FOUND', `Onboarding endpoint ${request.method} /onboarding/${route} was not found.`)
}

export const GET = handle
export const POST = handle
