import 'server-only'

import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { runOnboarding } from '../../../../lib/onboarding/orchestrator'

const WEBHOOK_EVENT_TYPE = 'checkout.session.completed'
export const runtime = 'nodejs'

export async function POST(request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeSecretKey || !stripeWebhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook is not configured' },
      { status: 500 }
    )
  }

  const stripe = new Stripe(stripeSecretKey)
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const payload = await request.text()
  let event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 })
  }

  if (event.type !== WEBHOOK_EVENT_TYPE) {
    return NextResponse.json({ received: true, ignored: true }, { status: 200 })
  }

  const session = event.data.object

  try {
    const onboardingPayload = buildOnboardingPayload({ session, eventId: event.id })
    const result = await runOnboarding(onboardingPayload)

    return NextResponse.json(
      {
        received: true,
        processed: true,
        project_slug: result.project_slug,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Onboarding failed'
    const normalizedMessage = String(message).toLowerCase()

    if (normalizedMessage.includes('already being processed')) {
      return NextResponse.json({ received: true, processing: true }, { status: 500 })
    }

    if (
      normalizedMessage.includes('missing required field') ||
      normalizedMessage.includes('invalid package_type value')
    ) {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function buildOnboardingPayload({ session, eventId }) {
  const metadata = session?.metadata || {}
  const customerEmail = String(session?.customer_details?.email || session?.customer_email || '').trim()
  const packageType = String(metadata.package_type || '').trim().toLowerCase()
  const coupleDisplayName = String(metadata.couple_display_name || '').trim()
  const slug = String(metadata.slug || '').trim().toLowerCase()
  const externalOrderId = String(metadata.external_order_id || session?.id || '').trim()

  return {
    customer_email: customerEmail,
    package_type: packageType,
    couple_display_name: coupleDisplayName,
    slug,
    external_order_id: externalOrderId,
    external_event_id: String(eventId || '').trim(),
    provider: 'stripe',
  }
}
