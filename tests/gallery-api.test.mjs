import test from 'node:test'
import assert from 'node:assert/strict'
import { createGalleryHandlers } from '../lib/galleryApi.mjs'

function setup(overrides = {}, options = {}) {
  const project = { id: 'project-a', owner_user_id: 'owner-a', slug: 'wedding-a', package_type: 'signature', payment_status: 'paid', project_status: 'active', ...overrides }
  const mutations = []
  const storageCalls = []
  const db = {
    storage: { from() { return {
      async upload(path) { storageCalls.push(['upload', path]); return { error: null } },
      async remove(paths) { storageCalls.push(['remove', ...paths]); return { error: null } },
    } } },
    auth: { getUser: async token => ({ data: { user: ['owner-a', 'owner-b'].includes(token) ? { id: token } : null } }) },
    from(table) {
      const filters = {}
      let operation = 'select'
      let payload
      const query = {
        select() { return query },
        eq(key, value) { filters[key] = value; return query },
        update(value) { operation = 'update'; payload = value; return query },
        upsert(value) { operation = 'upsert'; payload = value; return query },
        insert(value) { operation = 'insert'; payload = value; return query },
        order() { return query },
        limit() { return query },
        async maybeSingle() {
          if (table === 'projects') return { data: Object.entries(filters).every(([key, value]) => project[key] === value) ? project : null }
          return { data: null }
        },
        then(resolve, reject) {
          if (operation !== 'select') mutations.push({ table, operation, payload, filters })
          return Promise.resolve({ data: [], error: operation === 'insert' ? options.insertError || null : null }).then(resolve, reject)
        },
      }
      return query
    },
  }
  const handlers = createGalleryHandlers({ getSupabaseAdmin: () => db, readWeddingGallery: async () => null, randomUUID: () => 'photo-a' })
  const context = { params: Promise.resolve({ slug: 'wedding-a' }) }
  async function call(method, body, token = 'owner-a') {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'
    return handlers[method](new Request('https://example.invalid/api/gallery/wedding-a', { method, headers, ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}) }), context)
  }
  return { call, mutations, storageCalls }
}

test('all gallery methods reject anonymous and other-owner access', async () => {
  for (const method of ['GET', 'POST', 'DELETE']) {
    const { call } = setup()
    assert.equal((await call(method, undefined, null)).status, 401)
    assert.equal((await call(method, undefined, 'invalid')).status, 401)
    assert.equal((await call(method, undefined, 'owner-b')).status, 404)
  }
})

test('gallery handlers enforce paid active premium package for every mutation', async () => {
  for (const patch of [{ package_type: 'essential' }, { payment_status: 'refunded' }, { project_status: 'inactive' }]) {
    const { call, mutations } = setup(patch)
    for (const method of ['GET', 'POST', 'DELETE']) assert.equal((await call(method, method === 'POST' ? { action: 'settings', published: true } : undefined)).status, 403)
    assert.equal(mutations.length, 0)
  }
})

test('settings require explicit boolean publication and constrain user content', async () => {
  const { call, mutations } = setup()
  assert.equal((await call('POST', { action: 'settings', published: 'false' })).status, 400)
  assert.equal((await call('POST', { action: 'settings', published: false, title: 'x'.repeat(150), introduction: 'y'.repeat(800) })).status, 200)
  assert.equal(mutations[0].payload.project_id, 'project-a')
  assert.equal(mutations[0].payload.title.length, 100)
  assert.equal(mutations[0].payload.introduction.length, 600)
  assert.equal(mutations[0].payload.published, false)
})

test('unknown photos and stale reorder do not perform storage changes', async () => {
  const { call, mutations } = setup()
  assert.equal((await call('DELETE', { id: 'foreign-photo' })).status, 404)
  assert.equal((await call('POST', { action: 'caption', id: 'foreign-photo', caption: 'test' })).status, 404)
  assert.equal((await call('POST', { action: 'reorder', ids: ['foreign-photo'] })).status, 409)
  assert.equal(mutations.length, 0)
})

test('uploads reject disguised SVG before touching storage', async () => {
  const { call } = setup()
  const body = new FormData()
  body.append('photo', new Blob(['<svg/>'], { type: 'image/jpeg' }), 'photo.jpg')
  const response = await call('POST', body)
  assert.equal(response.status, 400)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
})

test('accepted upload is stored under the authorized project with a server generated ID', async () => {
  const { call, mutations, storageCalls } = setup()
  const body = new FormData()
  body.append('photo', new Blob([new Uint8Array([255, 216, 255, 224])], { type: 'image/jpeg' }), '../../foreign.jpg')
  assert.equal((await call('POST', body)).status, 200)
  assert.deepEqual(storageCalls, [['upload', 'project-a/photo-a.jpg']])
  const photo = mutations.find(item => item.operation === 'insert').payload
  assert.equal(photo.project_id, 'project-a')
  assert.equal(photo.storage_path, 'project-a/photo-a.jpg')
})

test('database quota failure removes the uploaded object and returns an actionable error', async () => {
  const { call, storageCalls } = setup({}, { insertError: { code: '23514' } })
  const body = new FormData()
  body.append('photo', new Blob([new Uint8Array([255, 216, 255, 224])], { type: 'image/jpeg' }), 'photo.jpg')
  assert.equal((await call('POST', body)).status, 409)
  assert.deepEqual(storageCalls, [['upload', 'project-a/photo-a.jpg'], ['remove', 'project-a/photo-a.jpg']])
})
