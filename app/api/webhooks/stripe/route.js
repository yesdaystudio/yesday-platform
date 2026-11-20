import { handleStripeWebhook } from '../../../../lib/stripeCheckoutOnboarding'

export const runtime = 'nodejs'
export const maxDuration = 60
export const POST = handleStripeWebhook
