import { PACKAGE_PRICE_DATA } from './checkoutCatalog.mjs'

export function paidSessionPayload(session, eventId, env = {}) {
  if (session?.status !== 'complete' || session?.payment_status !== 'paid' || session?.mode !== 'payment') throw new Error('Checkout is not paid')
  if (env.VERCEL_ENV === 'production' && session.livemode === false && env.ALLOW_PRODUCTION_TEST_ONBOARDING !== 'true') throw new Error('Test-mode onboarding is disabled on production')
  const metadata = session.metadata || {}
  const packageType = String(metadata.package_type || '').toLowerCase().trim()
  const price = PACKAGE_PRICE_DATA[packageType]
  if (!price || session.currency !== 'eur' || session.amount_total !== price.unit_amount) throw new Error('Checkout amount does not match package')
  return {
    customer_email: String(session.customer_details?.email || session.customer_email || '').trim().toLowerCase(),
    package_type: packageType, couple_display_name: String(metadata.couple_display_name || '').trim(),
    design_family: String(metadata.design_family || 'diana').trim().toLowerCase(), slug: String(metadata.slug || '').trim().toLowerCase(),
    external_order_id: session.id, external_event_id: eventId || null, provider: 'stripe', test_mode: session.livemode === false,
  }
}

export function createStripeOnboardingApi({ getStripe, runOnboarding, env = process.env, log = console.error }) {
  return {
    async webhook(request) {
      if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) return Response.json({ error: 'Stripe webhook is not configured' }, { status: 500 })
      const signature = request.headers.get('stripe-signature')
      if (!signature) return Response.json({ error: 'Missing stripe signature' }, { status: 400 })
      let event
      try { event = getStripe().webhooks.constructEvent(await request.text(), signature, env.STRIPE_WEBHOOK_SECRET) }
      catch { return Response.json({ error: 'Invalid Stripe signature' }, { status: 400 }) }
      if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) return Response.json({ received: true, ignored: true })
      if (event.data.object.payment_status !== 'paid') return Response.json({ received: true, pending: true })
      try {
        const result = await runOnboarding(paidSessionPayload(event.data.object, event.id, env))
        return Response.json({ received: true, processed: true, project_slug: result.project_slug })
      } catch (error) {
        log('[stripe-webhook] Onboarding failed', { eventId: event.id, code: error.code || error.name || 'unknown' })
        return Response.json({ error: 'Unable to complete onboarding' }, { status: 500 })
      }
    },
    async complete(sessionId) {
      if (!/^cs_[a-zA-Z0-9_]{1,250}$/.test(String(sessionId || ''))) throw new Error('Invalid checkout session')
      if (!env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured')
      const session = await getStripe().checkout.sessions.retrieve(sessionId)
      if (session.status === 'expired') return { ready: false, expired: true, livemode: session.livemode }
      if (session.status !== 'complete' || session.payment_status !== 'paid') return { ready: false, payment_status: session.payment_status, livemode: session.livemode }
      const payload = paidSessionPayload(session, null, env)
      const result = await runOnboarding(payload)
      return { ready: true, project_slug: result.project_slug, access_url: payload.test_mode ? result.access_url || null : null, email_sent: Boolean(result.email_sent), customer_email: payload.customer_email, livemode: session.livemode }
    },
  }
}
