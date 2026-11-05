import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequestProtection, readProtectedJson, requestIp, protectionResponse, RequestProtectionError } from '../lib/requestProtection.mjs'

const KEY = '123e4567-e89b-42d3-a456-426614174000'
export function protectionFixture() {
  const operations = new Map(), buckets = new Map(), calls = []
  const db = { async rpc(name, args) {
    calls.push({ name, args })
    if (name === 'consume_request_limit') {
      const count = (buckets.get(args.p_key_hash) || 0) + 1
      buckets.set(args.p_key_hash, count)
      return { data: { allowed: count <= args.p_limit, retry_after: 15 } }
    }
    if (name === 'claim_request_operation') {
      const record = operations.get(args.p_operation_key)
      if (record?.hash !== undefined && record.hash !== args.p_payload_hash) return { data: { status: 'conflict' } }
      if (record?.completed) return { data: { status: 'replay', result: record.result } }
      if (record?.busy) return { data: { status: 'busy' } }
      operations.set(args.p_operation_key, { hash: args.p_payload_hash, busy: true, token: args.p_claim_token })
      return { data: { status: 'claimed' } }
    }
    const record = operations.get(args.p_operation_key)
    if (name === 'finish_request_operation') { Object.assign(record, { completed: true, result: args.p_result }); return { data: true } }
    if (name === 'release_request_operation') { record.busy = false; return {} }
    throw new Error('Unexpected RPC')
  } }
  return { protection: createRequestProtection({ db, secret: 'test-secret', vercel: true }), operations, calls }
}
const form = body => new Request('https://example.invalid/form', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

test('body reader rejects wrong types, honeypots and streaming bodies over the limit', async () => {
  assert.deepEqual(await readProtectedJson(form({ name: 'Žofia' })), { name: 'Žofia' })
  for (const body of [null, [], 'text', { company_website: 'spam' }]) await assert.rejects(readProtectedJson(form(body)), error => error.status === 400)
  await assert.rejects(readProtectedJson(form({ text: 'é'.repeat(100) }), 100), error => error.status === 413)
  await assert.rejects(readProtectedJson(new Request('https://example.invalid', { method: 'POST', body: '{}' })), error => error.status === 415)
})

test('production IP cannot be spoofed using the general forwarded header', () => {
  const request = new Request('https://example.invalid', { headers: { 'x-vercel-forwarded-for': '192.0.2.1', 'x-forwarded-for': '198.51.100.1' } })
  assert.equal(requestIp(request, true), '192.0.2.1')
  assert.throws(() => requestIp(new Request('https://example.invalid', { headers: { 'x-forwarded-for': '198.51.100.1' } }), true), error => error.status === 503)
})

test('limits use opaque hashes and respond with Retry-After', async () => {
  const { protection, calls } = protectionFixture()
  await protection.limit('example', 'private@example.invalid', 1, 60)
  let failure
  try { await protection.limit('example', 'private@example.invalid', 1, 60) } catch (error) { failure = error }
  assert.equal(failure.status, 429)
  assert.equal(protectionResponse(failure).headers.get('Retry-After'), '15')
  assert.match(calls[0].args.p_key_hash, /^[a-f0-9]{64}$/)
  assert.equal(JSON.stringify(calls).includes('private@example.invalid'), false)
})

test('protection fails closed if the shared limiter is unavailable', async () => {
  const protection = createRequestProtection({ db: { rpc: async () => ({ error: { code: 'TEST_DB_ERROR' } }) }, secret: 'test' })
  await assert.rejects(protection.limit('scope', 'actor', 1, 60))
  assert.equal(protectionResponse(new Error('private internal details')).status, 503)
})

test('concurrent requests cannot run the same external action twice', async () => {
  const { protection } = protectionFixture()
  const intent = { scope: 'email', actor: 'owner-a', requestKey: KEY, payload: { body: 'text' } }
  let finish, called = 0
  const work = () => { called++; return new Promise(resolve => { finish = resolve }) }
  const first = protection.run(intent, work)
  await new Promise(resolve => setImmediate(resolve))
  await assert.rejects(protection.run(intent, work), error => error.status === 409)
  finish({ sent: true })
  assert.deepEqual(await first, { sent: true })
  assert.deepEqual(await protection.run(intent, work), { sent: true })
  assert.equal(called, 1)
})

test('retry after a provider failure preserves its idempotency key', async () => {
  const { protection } = protectionFixture()
  const intent = { scope: 'checkout', actor: 'customer', requestKey: KEY, payload: { price: 12900 } }
  const keys = []
  await assert.rejects(protection.run(intent, async key => { keys.push(key); throw new Error('timeout') }))
  await protection.run(intent, async key => { keys.push(key); return { url: 'https://checkout.example.invalid' } })
  assert.equal(keys[0], keys[1])
  await assert.rejects(protection.run({ ...intent, payload: { price: 24900 } }, async () => ({})), error => error.status === 409)
})

test('cross-site form posts are rejected before consuming quota', async () => {
  const { protection, calls } = protectionFixture()
  await assert.rejects(protection.check(new Request('https://example.invalid/form', { headers: { origin: 'https://attacker.invalid', 'x-vercel-forwarded-for': '192.0.2.1' } }), 'checkout'), error => error.status === 403)
  assert.equal(calls.length, 0)
})
