import test from 'node:test'
import assert from 'node:assert/strict'
import { createCheckoutHandler } from '../lib/checkoutApi.mjs'
import { createRequestProtection } from '../lib/requestProtection.mjs'

const KEY = '123e4567-e89b-42d3-a456-426614174000'
function setup(overrides = {}) {
  const created = [], completed = new Map()
  const db = { async rpc(name, args) {
    if (name === 'consume_request_limit') return { data: { allowed: true } }
    if (name === 'claim_request_operation') {
      const previous = completed.get(args.p_operation_key)
      if (previous?.hash !== undefined && previous.hash !== args.p_payload_hash) return { data: { status: 'conflict' } }
      if (previous?.result) return { data: { status: 'replay', result: previous.result } }
      completed.set(args.p_operation_key, { hash: args.p_payload_hash })
      return { data: { status: 'claimed' } }
    }
    if (name === 'finish_request_operation') { completed.get(args.p_operation_key).result = args.p_result; return { data: true } }
    return {}
  } }
  class Stripe { checkout = { sessions: { create: async (payload, options) => { created.push({ payload, options }); return { url: 'https://checkout.example.invalid/test' } } } } }
  const protection = createRequestProtection({ db, secret: 'test' })
  const env = { NODE_ENV: 'production', SALES_OPEN: 'true', STRIPE_SECRET_KEY: 'sk_test_fake', NEXT_PUBLIC_SITE_URL: 'https://preview.example.invalid', ...overrides }
  const handler = createCheckoutHandler({ Stripe, env, getProtection: () => protection })
  const call = (patch = {}) => handler(new Request('https://preview.example.invalid/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_key: KEY, package_type: 'essential', customer_email: 'test@example.invalid', couple_display_name: 'Test a Test', design_family: 'diana', ...patch }) }))
  return { call, created }
}

test('closed sales and production test-key safety remain enforced', async () => {
  for (const env of [{ SALES_OPEN: 'false' }, { NEXT_PUBLIC_SITE_URL: 'https://www.yesdaystudio.com' }]) {
    const { call, created } = setup(env)
    assert.equal((await call()).status, 503)
    assert.equal(created.length, 0)
  }
})
test('repeated checkout reuses the original session and cannot change its price', async () => {
  const { call, created } = setup()
  assert.equal((await call()).status, 200)
  assert.equal((await call()).status, 200)
  assert.equal(created.length, 1)
  assert.ok(created[0].options.idempotencyKey.startsWith('yesday-checkout-'))
  assert.equal((await call({ package_type: 'signature' })).status, 409)
  assert.equal(created.length, 1)
})
test('checkout rejects bots, oversized names and invalid email types before Stripe', async () => {
  const { call, created } = setup()
  for (const patch of [{ company_website: 'bot' }, { couple_display_name: 'a'.repeat(161) }, { customer_email: 5 }, { request_key: null }]) assert.equal((await call(patch)).status, 400)
  assert.equal(created.length, 0)
})

test('private checkout still requires its access token and a test Stripe key', async () => {
  const restricted = setup({ CHECKOUT_TEST_ONLY: 'true', CHECKOUT_TEST_ACCESS_TOKEN: 'private-test-access' })
  assert.equal((await restricted.call()).status, 403)
  assert.equal((await restricted.call({ test_access_token: 'wrong' })).status, 403)
  assert.equal((await restricted.call({ test_access_token: 'private-test-access' })).status, 200)
  const unsafe = setup({ CHECKOUT_TEST_ONLY: 'true', CHECKOUT_TEST_ACCESS_TOKEN: 'private-test-access', STRIPE_SECRET_KEY: 'sk_live_fake' })
  assert.equal((await unsafe.call({ test_access_token: 'private-test-access' })).status, 503)
  assert.equal(unsafe.created.length, 0)
})
