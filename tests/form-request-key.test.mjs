import test from 'node:test'
import assert from 'node:assert/strict'
import { getFormRequestKey } from '../lib/formRequestKey.mjs'

test('same browser checkout reuses its key without storing form data', async () => {
  const records = new Map()
  globalThis.sessionStorage = { getItem: key => records.get(key), setItem: (key, value) => records.set(key, value) }
  const payload = { email: 'private@example.invalid', package: 'essential' }
  const first = await getFormRequestKey('test-checkout', payload)
  assert.equal(await getFormRequestKey('test-checkout', payload), first)
  assert.notEqual(await getFormRequestKey('test-checkout', { ...payload, package: 'signature' }), first)
  assert.equal(JSON.stringify([...records]).includes('private@example.invalid'), false)
  const storageKey = [...records.keys()][0]
  records.set(storageKey, JSON.stringify({ id: first, createdAt: Date.now() - 24 * 60 * 60 * 1000 }))
  assert.notEqual(await getFormRequestKey('test-checkout', payload), first)
  records.set(storageKey, JSON.stringify({ id: 'broken', createdAt: Date.now() }))
  assert.match(await getFormRequestKey('test-checkout', payload), /^[a-f0-9-]{36}$/)
  delete globalThis.sessionStorage
})

test('blocked browser storage still keeps one key for the open page', async () => {
  const first = await getFormRequestKey('storage-blocked', { package: 'essential' })
  assert.equal(await getFormRequestKey('storage-blocked', { package: 'essential' }), first)
})
