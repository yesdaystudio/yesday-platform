import test from 'node:test'
import assert from 'node:assert/strict'
import { createGenericRsvpHandler, createPersonalizedRsvpHandler } from '../lib/rsvpApi.mjs'
import { RequestProtectionError } from '../lib/requestProtection.mjs'

const KEY = '123e4567-e89b-42d3-a456-426614174000'
function setup({ limited = false, personal = false } = {}) {
  const rows = new Map()
  let writes = 0
  const db = { from(table) {
    let row, conflict, filters = {}
    const q = {
      select() { return q }, eq(k,v) { filters[k]=v; return q },
      async maybeSingle() { return { data: { id: 'project-a', package_type: 'signature' } } },
      upsert(value, options) { row=value; conflict=options.onConflict; return q },
      then(resolve, reject) {
        if (row) { rows.set(conflict === 'invitation_recipient_id' ? row.invitation_recipient_id : row.submission_key, row); writes++ }
        return Promise.resolve({ error: null, count: rows.size }).then(resolve,reject)
      },
    }
    return q
  } }
  const deps = { getSupabaseAdmin: () => db, getProtection: () => ({ check: async () => { if(limited) throw new RequestProtectionError('Wait',429,20) } }), loadInvitation: async () => ({ id:'recipient-a', project_id:'project-a' }) }
  const handler = personal ? createPersonalizedRsvpHandler(deps) : createGenericRsvpHandler(deps)
  const call = (patch = {}) => handler(new Request('https://example.invalid', { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ submission_key:KEY, attending:'yes',adults_count:1,children_count:0,people:[{name:'Test',type:'adult',menu:'meat'}],...patch }) }), { params:Promise.resolve({slug:'test',token:'a'.repeat(64)}) })
  return { call, rows, get writes() { return writes } }
}
test('both RSVP forms stop before writing when rate limited', async () => {
  for(const personal of [false,true]) { const fixture=setup({limited:true,personal}); const response=await fixture.call(); assert.equal(response.status,429);assert.equal(response.headers.get('Retry-After'),'20');assert.equal(fixture.writes,0) }
})
test('personalized concurrent submissions use one upsert target and allow corrections', async () => {
  const fixture=setup({personal:true})
  const responses=await Promise.all([fixture.call(),fixture.call()])
  assert.ok(responses.every(r=>r.status===200));assert.equal(fixture.rows.size,1)
  assert.equal((await fixture.call({people:[{name:'Corrected',type:'adult',menu:'meat'}]})).status,200)
  assert.equal(fixture.rows.get('recipient-a').people[0].name,'Corrected')
})
test('honeypot does not save an RSVP',async()=>{const fixture=setup();assert.equal((await fixture.call({company_website:'bot'})).status,400);assert.equal(fixture.writes,0)})
