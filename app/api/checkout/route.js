import 'server-only'
import Stripe from 'stripe'
import { getRequestProtection } from '../../../lib/serverRequestProtection'
import { createCheckoutHandler } from '../../../lib/checkoutApi.mjs'

export const runtime = 'nodejs'
export const POST = createCheckoutHandler({ Stripe, getProtection: getRequestProtection })
