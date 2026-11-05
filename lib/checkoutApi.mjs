import { timingSafeEqual } from 'node:crypto'
import { readProtectedJson, protectionResponse } from './requestProtection.mjs'



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
  chloe: 'Chloe',
  fleurie: 'Fleurie',
  provence: 'Provence',
  lavande: 'Lavande',
  veno: 'Veno',
  riviera: 'Riviera',
}

export function createCheckoutHandler({ Stripe, getProtection, env = process.env }) {
return async function POST(request) {
  const stripeSecretKey = env.STRIPE_SECRET_KEY
  const configuredSiteUrl = env.NEXT_PUBLIC_SITE_URL
  const salesOpen = env.SALES_OPEN === 'true' || env.NODE_ENV !== 'production'
  const testOnly = env.CHECKOUT_TEST_ONLY === 'true'

  if (!salesOpen) {
    return Response.json(
      { error: 'Objednávky zatiaľ pripravujeme. Napíšte nám a ozveme sa vám medzi prvými.' },
      { status: 503 }
    )
  }

  if (!stripeSecretKey) {
    return Response.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    )
  }

  if (!configuredSiteUrl) {
    return Response.json(
      { error: 'NEXT_PUBLIC_SITE_URL is not configured' },
      { status: 500 }
    )
  }

  const requestOrigin = new URL(request.url).origin
  const siteUrl = env.VERCEL_ENV === 'preview' ? requestOrigin : configuredSiteUrl
  const isPublicProductionSite = /https:\/\/(?:www\.)?yesdaystudio\.com(?:\/|$)/i.test(siteUrl)
  if (isPublicProductionSite && stripeSecretKey.startsWith('sk_test_')) {
    console.error('[checkout] Blocked test Stripe key on the public production site')
    return Response.json(
      { error: 'Objednávky zatiaľ pripravujeme. Napíšte nám a ozveme sa vám medzi prvými.' },
      { status: 503 }
    )
  }

  let body, protection
  try {
    body = await readProtectedJson(request, 8192)
    protection = getProtection()
    await protection.check(request, 'checkout')
  } catch (error) { return protectionResponse(error) }

  if (testOnly) {
    const expectedToken = String(env.CHECKOUT_TEST_ACCESS_TOKEN || '')
    const providedToken = String(body?.test_access_token || '')
    if (!safeTokenEqual(providedToken, expectedToken)) {
      return Response.json({ error: 'Súkromný testovací odkaz nie je platný.' }, { status: 403 })
    }
    if (!stripeSecretKey.startsWith('sk_test_')) {
      console.error('[checkout] Test-only checkout does not have a Stripe test key')
      return Response.json({ error: 'Testovacia platba nie je bezpečne nakonfigurovaná.' }, { status: 503 })
    }
  }

  const { package_type, couple_display_name, slug, customer_email, design_family } = body

  if (!package_type || !ALLOWED_PACKAGES.has(package_type)) {
    return Response.json(
      { error: 'Invalid or missing package_type. Must be: essential, signature, or atelier.' },
      { status: 400 }
    )
  }

  if (typeof couple_display_name !== 'string' || !couple_display_name.trim() || couple_display_name.trim().length > 160) {
    return Response.json(
      { error: 'Missing couple_display_name' },
      { status: 400 }
    )
  }

  if (typeof customer_email !== 'string' || customer_email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email.trim())) {
    return Response.json(
      { error: 'Invalid or missing customer_email' },
      { status: 400 }
    )
  }

  const cleanSiteUrl = siteUrl.replace(/\/$/, '')
  const priceData = PACKAGE_PRICE_DATA[package_type]
  const cleanDesignFamily = ['diana', 'botanique', 'penelope', 'chloe', 'fleurie', 'provence', 'lavande', 'veno', 'riviera'].includes(String(design_family || '').trim().toLowerCase())
    ? String(design_family).trim().toLowerCase()
    : 'diana'

  const metadata = {
    package_type,
    couple_display_name: couple_display_name.trim(),
    design_family: cleanDesignFamily,
  }
  if (typeof slug === 'string' && slug.trim().length > 80) return Response.json({ error: 'Adresa webu môže mať najviac 80 znakov.' }, { status: 400 })
  if (slug && typeof slug === 'string') {
    metadata.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
  }

  const stripe = new Stripe(stripeSecretKey)
  const cancelParams = new URLSearchParams({ design: cleanDesignFamily })
  if (testOnly) cancelParams.set('checkout_test', String(body.test_access_token || ''))

  let session
  try {
    session = await protection.run({ scope: 'checkout', actor: customer_email.trim().toLowerCase(), requestKey: body.request_key, payload: { metadata, customer_email: customer_email.trim().toLowerCase(), testOnly, siteUrl: cleanSiteUrl, unit_amount: priceData.unit_amount } }, async (idempotencyKey) => {
    await protection.limit('checkout:customer', customer_email.trim().toLowerCase(), 10, 3600)
    const created = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customer_email.trim().toLowerCase(),
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
      cancel_url: `${cleanSiteUrl}/?${cancelParams.toString()}#cennik`,
    }, { idempotencyKey })
    return { url: created.url }
    })
  } catch (err) {
    if (!err.type) return protectionResponse(err)
    console.error('[checkout] Stripe session creation failed:', err.code || err.type || 'unknown')
    return Response.json(
      { error: 'Failed to create Stripe checkout session' },
      { status: 500 }
    )
  }

  return Response.json({ url: session.url }, { headers: { 'Cache-Control': 'no-store' } })
}
}

function safeTokenEqual(provided, expected) {
  if (!provided || !expected) return false
  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer)
}
