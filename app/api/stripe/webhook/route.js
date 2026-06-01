import 'server-only'

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const CHECKOUT_COMPLETED_EVENT = 'checkout.session.completed'

export async function POST(request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!stripeSecretKey || !stripeWebhookSecret) {
    console.error('[stripe-webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 500 })
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('[stripe-webhook] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    console.error('[stripe-webhook] Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const stripe = new Stripe(stripeSecretKey)
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  let event
  try {
    const payload = await request.text()
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret)
    console.log('[stripe-webhook] Event verified', { id: event.id, type: event.type })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook signature'
    console.error('[stripe-webhook] Signature verification failed', { error: message })
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 })
  }

  if (event.type !== CHECKOUT_COMPLETED_EVENT) {
    console.log('[stripe-webhook] Ignored event', { id: event.id, type: event.type })
    return NextResponse.json({ received: true, ignored: true }, { status: 200 })
  }

  const session = event.data.object
  const metadata = session.metadata || {}

  const packageType = String(metadata.package_type || '').trim().toLowerCase()
  const clientEmail = String(session?.customer_details?.email || session?.customer_email || '').trim().toLowerCase()
  const coupleDisplayName = String(metadata.couple_display_name || '').trim()
  const stripeCheckoutSessionId = String(session?.id || '').trim()
  const designFamily =
    typeof metadata.design_family === 'string' && metadata.design_family.trim()
      ? metadata.design_family.trim()
      : 'classic'

  if (!packageType || !clientEmail || !coupleDisplayName || !stripeCheckoutSessionId) {
    console.error('[stripe-webhook] Missing required data in checkout session', {
      eventId: event.id,
      packageType,
      hasClientEmail: Boolean(clientEmail),
      hasCoupleDisplayName: Boolean(coupleDisplayName),
      hasStripeCheckoutSessionId: Boolean(stripeCheckoutSessionId),
    })
    return NextResponse.json(
      { error: 'Missing required checkout metadata or customer email' },
      { status: 400 }
    )
  }

  const slug = slugify(coupleDisplayName)

  let hasStripeCheckoutSessionColumn = true

  const { data: existingOnboardingJob, error: onboardingJobError } = await supabase
    .from('onboarding_jobs')
    .select('id, status, project_id')
    .eq('provider', 'stripe')
    .eq('external_order_id', stripeCheckoutSessionId)
    .maybeSingle()

  if (onboardingJobError) {
    console.error('[stripe-webhook] Failed to check onboarding_jobs idempotency', {
      eventId: event.id,
      stripeCheckoutSessionId,
      error: onboardingJobError.message,
    })
  }

  if (existingOnboardingJob) {
    console.log('[stripe-webhook] Duplicate webhook ignored (onboarding job exists)', {
      eventId: event.id,
      stripeCheckoutSessionId,
      onboardingJobId: existingOnboardingJob.id,
    })
    return NextResponse.json(
      {
        received: true,
        processed: true,
        duplicate: true,
        source: 'onboarding_jobs',
      },
      { status: 200 }
    )
  }

  const { data: existingProject, error: existingProjectError } = await supabase
    .from('projects')
    .select('id, slug, stripe_checkout_session_id')
    .eq('stripe_checkout_session_id', stripeCheckoutSessionId)
    .maybeSingle()

  if (existingProjectError) {
    if (isMissingStripeSessionColumnError(existingProjectError)) {
      hasStripeCheckoutSessionColumn = false
      console.warn('[stripe-webhook] Missing projects.stripe_checkout_session_id column; project idempotency check skipped', {
        eventId: event.id,
        stripeCheckoutSessionId,
      })
    } else {
      console.error('[stripe-webhook] Failed to check project idempotency', {
        eventId: event.id,
        stripeCheckoutSessionId,
        error: existingProjectError.message,
      })
      return NextResponse.json({ error: 'Failed to run idempotency check' }, { status: 500 })
    }
  }

  if (existingProject) {
    console.log('[stripe-webhook] Duplicate webhook ignored (project exists)', {
      eventId: event.id,
      stripeCheckoutSessionId,
      projectId: existingProject.id,
      slug: existingProject.slug,
    })
    return NextResponse.json(
      {
        received: true,
        processed: true,
        duplicate: true,
        source: 'projects',
        project: existingProject,
      },
      { status: 200 }
    )
  }

  try {
    const insertPayload = {
      package_type: packageType,
      client_email: clientEmail,
      couple_display_name: coupleDisplayName,
      slug,
      payment_status: 'paid',
      project_status: 'onboarding',
      design_family: designFamily,
    }

    if (hasStripeCheckoutSessionColumn) {
      insertPayload.stripe_checkout_session_id = stripeCheckoutSessionId
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(insertPayload)
      .select('id, slug')
      .single()

    if (error) {
      if (isMissingStripeSessionColumnError(error)) {
        console.warn('[stripe-webhook] Insert hit missing stripe_checkout_session_id column; retrying without the column', {
          eventId: event.id,
          stripeCheckoutSessionId,
        })

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('projects')
          .insert({
            package_type: packageType,
            client_email: clientEmail,
            couple_display_name: coupleDisplayName,
            slug,
            payment_status: 'paid',
            project_status: 'onboarding',
            design_family: designFamily,
          })
          .select('id, slug')
          .single()

        if (fallbackError) {
          console.error('[stripe-webhook] Supabase fallback insert failed', {
            eventId: event.id,
            error: fallbackError.message,
          })
          return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
        }

        console.log('[stripe-webhook] Project created without stripe_checkout_session_id column', {
          eventId: event.id,
          projectId: fallbackData?.id,
          slug: fallbackData?.slug,
        })

        return NextResponse.json(
          {
            received: true,
            processed: true,
            project: fallbackData,
            warning:
              "Missing projects.stripe_checkout_session_id column. Add it for stronger idempotency.",
          },
          { status: 200 }
        )
      }

      console.error('[stripe-webhook] Supabase insert failed', {
        eventId: event.id,
        error: error.message,
      })
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    console.log('[stripe-webhook] Project created', {
      eventId: event.id,
      projectId: data?.id,
      slug: data?.slug,
    })

    return NextResponse.json({ received: true, processed: true, project: data }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected webhook error'
    console.error('[stripe-webhook] Unexpected error', { eventId: event.id, error: message })
    return NextResponse.json({ error: 'Unexpected webhook error' }, { status: 500 })
  }
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isMissingStripeSessionColumnError(error) {
  if (!error) {
    return false
  }

  const message = String(error.message || '').toLowerCase()
  return message.includes('stripe_checkout_session_id') && message.includes('column')
}
