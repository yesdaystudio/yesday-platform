import 'server-only'
import Stripe from 'stripe'
import { runOnboarding } from './onboarding/orchestrator'
import { createStripeOnboardingApi } from './stripeOnboardingApi.mjs'

const api = createStripeOnboardingApi({ getStripe: () => new Stripe(process.env.STRIPE_SECRET_KEY), runOnboarding })
export const handleStripeWebhook = api.webhook
export const completeCheckoutFromSessionId = api.complete
