import test from 'node:test'
import assert from 'node:assert/strict'
import { createAccommodationEmailHandler } from '../lib/accommodationEmailApi.mjs'

const ID = '123e4567-e89b-42d3-a456-426614174000'
function setup({ projectPatch = {}, guestPatch = {}, user = { id: 'owner-a', email: 'owner@example.invalid' }, storageError = null, senderError = null, statusError = null } = {}) {
  const deliveries = [], updates = []
  const project = { id: 'project-a', owner_user_id: 'owner-a', package_type: 'signature', payment_status: 'paid', project_status: 'active', client_email: 'reply@example.invalid', couple_display_name: 'Skúšobný pár', ...projectPatch }
  const guest = { id: ID, project_id: 'project-a', contact_email: 'guest@example.invalid', attending: 'yes', needs_accommodation: true, ...guestPatch }
  const db = {
    auth: { getUser: async () => ({ data: { user } }) },
    from(table) {
      const filters = {}
      const query = {
        select() { return query },
        eq(key, value) { filters[key] = value; return query },
        update(value) { updates.push(value); return query },
        async maybeSingle() {
          if (storageError) return { error: storageError }
          const record = table === 'projects' ? project : guest
          return { data: Object.entries(filters).every(([key, value]) => record[key] === value) ? record : null }
        },
        then(resolve, reject) { return Promise.resolve({ error: statusError }).then(resolve, reject) },
      }
      return query
    },
  }
  const handler = createAccommodationEmailHandler({
    getSupabaseAdmin: () => db,
    createAccommodationEmail: ({ subject, body }) => ({ subject, text: body, html: '<p>Test</p>' }),
    sendTransactionalEmail: async message => { if (senderError) throw senderError; deliveries.push(message); return { id: 'email-test' } },
  })
  function call(payload = {}, token = 'test') {
    return handler(new Request('https://example.invalid/api/accommodation-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ response_id: ID, subject: 'Ubytovanie', body: 'Informácie o pobyte.', ...payload }),
    }))
  }
  return { call, deliveries, updates }
}

test('accommodation email requires a valid session and guest ID', async () => {
  const { call, deliveries } = setup()
  assert.equal((await call({}, null)).status, 401)
  assert.equal((await call({ response_id: 'invalid' })).status, 400)
  assert.equal((await setup({ user: null }).call()).status, 401)
  assert.equal(deliveries.length, 0)
})

test('other owners cannot send email or learn whether a guest has email', async () => {
  for (const contact_email of ['guest@example.invalid', null]) {
    const { call, deliveries } = setup({ projectPatch: { owner_user_id: 'owner-b' }, guestPatch: { contact_email } })
    assert.equal((await call()).status, 404)
    assert.equal(deliveries.length, 0)
  }
})

test('Essential, unpaid, onboarding, refunded and inactive projects cannot send', async () => {
  for (const projectPatch of [{ package_type: 'essential' }, { payment_status: null }, { payment_status: 'refunded' }, { project_status: 'onboarding' }, { project_status: 'inactive' }]) {
    const { call, deliveries, updates } = setup({ projectPatch })
    assert.equal((await call()).status, 403)
    assert.equal(deliveries.length, 0)
    assert.equal(updates.length, 0)
  }
})

test('declining guests and guests not requesting accommodation are excluded', async () => {
  for (const guestPatch of [{ attending: 'no' }, { needs_accommodation: false }, { contact_email: null }]) {
    const { call, deliveries } = setup({ guestPatch })
    assert.equal((await call()).status, 400)
    assert.equal(deliveries.length, 0)
  }
})

test('eligible premium owner sends only to the stored guest address', async () => {
  for (const package_type of ['signature', 'atelier']) {
    const { call, deliveries, updates } = setup({ projectPatch: { package_type } })
    const response = await call({ to: 'injected@example.invalid', replyTo: 'injected@example.invalid' })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
    assert.equal(deliveries[0].to, 'guest@example.invalid')
    assert.equal(deliveries[0].replyTo, 'reply@example.invalid')
    assert.equal(updates.length, 1)
    assert.ok(updates[0].accommodation_email_sent_at)
  }
})

test('failed access verification never calls the sender', async () => {
  const { call, deliveries, updates } = setup({ storageError: { code: 'TEST_DB_UNAVAILABLE' } })
  assert.equal((await call()).status, 503)
  assert.equal(deliveries.length, 0)
  assert.equal(updates.length, 0)
})

test('delivery failure does not mark the guest email as sent', async () => {
  const { call, updates } = setup({ senderError: new Error('Test delivery failure') })
  assert.equal((await call()).status, 502)
  assert.equal(updates.length, 0)
})

test('an accepted email remains successful when saving its status fails', async () => {
  const { call, deliveries } = setup({ statusError: { code: 'TEST_STATUS_WRITE_FAILED' } })
  const response = await call()
  assert.equal(response.status, 200)
  const result = await response.json()
  assert.equal(result.sent, true)
  assert.equal(result.status_saved, false)
  assert.equal(deliveries.length, 1)
})
