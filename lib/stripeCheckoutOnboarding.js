import 'server-only'

import Stripe from 'stripe'
import { runOnboarding } from './onboarding/orchestrator'

const WEBHOOK_EVENT_TYPE = 'checkout.session.completed'

export async function handleStripeWebhook(request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeSecretKey || !stripeWebhookSecret) {
    console.error('[stripe-webhook] Missing Stripe configuration')
    return Response.json({ error: 'Stripe webhook is not configured' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const stripe = new Stripe(stripeSecretKey)
  let event

  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, stripeWebhookSecret)
  } catch (error) {
    console.error('[stripe-webhook] Signature verification failed', error)
    return Response.json({ error: 'Invalid Stripe signature' }, { status: 400 })
  }

  if (event.type !== WEBHOOK_EVENT_TYPE) {
    return Response.json({ received: true, ignored: true }, { status: 200 })
  }

  try {
    const result = await processCheckoutSession(event.data.object, event.id)
    return Response.json({ received: true, processed: true, project_slug: result.project_slug }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Onboarding failed'
    console.error('[stripe-webhook] Onboarding failed', { eventId: event.id, error: message })
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function completeCheckoutFromSessionId(sessionId) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) throw new Error('Stripe is not configured')

  const cleanSessionId = String(sessionId || '').trim()
  if (!cleanSessionId.startsWith('cs_')) throw new Error('Invalid checkout session')

  const stripe = new Stripe(stripeSecretKey)
  const session = await stripe.checkout.sessions.retrieve(cleanSessionId)

  if (session.status !== 'complete' || session.payment_status !== 'paid') {
    return { ready: false, payment_status: session.payment_status, livemode: session.livemode }
  }

  const result = await processCheckoutSession(session, '')
  return {
    ready: true,
    project_slug: result.project_slug,
    access_url: result.access_url || null,
    email_sent: Boolean(result.email_sent),
    customer_email: getCustomerEmail(session),
    livemode: session.livemode,
  }
}

async function processCheckoutSession(session, eventId) {
  if (session?.payment_status !== 'paid') {
    throw new Error('Checkout session is not paid')
  }

  const isPublicProduction = process.env.VERCEL_ENV === 'production'
  const allowProductionTestOnboarding = process.env.ALLOW_PRODUCTION_TEST_ONBOARDING === 'true'
  if (isPublicProduction && session?.livemode === false && !allowProductionTestOnboarding) {
    console.error('[stripe-webhook] Blocked test-mode onboarding on production')
    throw new Error('Test-mode onboarding is disabled on production')
  }

  return runOnboarding(buildOnboardingPayload({ session, eventId }))
}

function buildOnboardingPayload({ session, eventId }) {
  const metadata = session?.metadata || {}

  return {
    customer_email: getCustomerEmail(session),
    package_type: String(metadata.package_type || '').trim().toLowerCase(),
    couple_display_name: String(metadata.couple_display_name || '').trim(),
    design_family: normalizeDesignFamily(metadata.design_family),
    slug: String(metadata.slug || '').trim().toLowerCase(),
    external_order_id: String(metadata.external_order_id || session?.id || '').trim(),
    external_event_id: String(eventId || '').trim(),
    provider: 'stripe',
    test_mode: session?.livemode === false,
  }
}

function getCustomerEmail(session) {
  return String(session?.customer_details?.email || session?.customer_email || '').trim().toLowerCase()
}

function normalizeDesignFamily(value) {
  const design = String(value || '').trim().toLowerCase()
  return ['diana', 'botanique', 'penelope'].includes(design) ? design : 'diana'
}
