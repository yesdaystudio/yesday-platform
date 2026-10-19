import { handleStripeWebhook } from '../../../../lib/stripeCheckoutOnboarding'

export const runtime = 'nodejs'
export const POST = handleStripeWebhook
