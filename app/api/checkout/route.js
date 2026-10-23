import 'server-only'

import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

const ALLOWED_PACKAGES = new Set(['essential', 'signature', 'atelier'])

const PACKAGE_PRICE_DATA = {
  essential: {
    name: 'YesDay Essential',
    unit_amount: 12900,
  },
  signature: {
    name: 'YesDay Signature',
    unit_amount: 24900,
  },
  atelier: {
    name: 'YesDay Atelier',
    unit_amount: 44900,
  },
}

const DESIGN_NAMES = {
  diana: 'Diana',
  botanique: 'Botanique',
  penelope: 'Penelope',
}

export async function POST(request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const salesOpen = process.env.SALES_OPEN === 'true' || process.env.NODE_ENV !== 'production'

  if (!salesOpen) {
    return NextResponse.json(
      { error: 'Objednávky zatiaľ pripravujeme. Napíšte nám a ozveme sa vám medzi prvými.' },
      { status: 503 }
    )
  }

  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    )
  }

  if (!siteUrl) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_SITE_URL is not configured' },
      { status: 500 }
    )
  }

  const isPublicProductionSite = /https:\/\/(?:www\.)?yesdaystudio\.com(?:\/|$)/i.test(siteUrl)
  if (isPublicProductionSite && stripeSecretKey.startsWith('sk_test_')) {
    console.error('[checkout] Blocked test Stripe key on the public production site')
    return NextResponse.json(
      { error: 'Objednávky zatiaľ pripravujeme. Napíšte nám a ozveme sa vám medzi prvými.' },
      { status: 503 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { package_type, couple_display_name, slug, customer_email, design_family } = body

  if (!package_type || !ALLOWED_PACKAGES.has(package_type)) {
    return NextResponse.json(
      { error: 'Invalid or missing package_type. Must be: essential, signature, or atelier.' },
      { status: 400 }
    )
  }

  if (!couple_display_name || typeof couple_display_name !== 'string') {
    return NextResponse.json(
      { error: 'Missing couple_display_name' },
      { status: 400 }
    )
  }

  if (!customer_email || !customer_email.includes('@')) {
    return NextResponse.json(
      { error: 'Invalid or missing customer_email' },
      { status: 400 }
    )
  }

  const cleanSiteUrl = siteUrl.replace(/\/$/, '')
  const priceData = PACKAGE_PRICE_DATA[package_type]
  const cleanDesignFamily = ['diana', 'botanique', 'penelope'].includes(String(design_family || '').trim().toLowerCase())
    ? String(design_family).trim().toLowerCase()
    : 'diana'

  const metadata = {
    package_type,
    couple_display_name: couple_display_name.trim(),
    design_family: cleanDesignFamily,
  }
  if (slug && typeof slug === 'string') {
    metadata.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
  }

  const stripe = new Stripe(stripeSecretKey)

  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customer_email.trim(),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: priceData.unit_amount,
            product_data: {
              name: `${priceData.name} · ${DESIGN_NAMES[cleanDesignFamily]}`,
              description: `Svadobný systém YesDay – dizajn ${DESIGN_NAMES[cleanDesignFamily]}`,
            },
          },
        },
      ],
      metadata,
      success_url: `${cleanSiteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cleanSiteUrl}/?design=${cleanDesignFamily}#cennik`,
    })
  } catch (err) {
    console.error('[checkout] Stripe session creation failed:', err)
    return NextResponse.json(
      { error: 'Failed to create Stripe checkout session' },
      { status: 500 }
    )
  }

  return NextResponse.json({ url: session.url })
}
