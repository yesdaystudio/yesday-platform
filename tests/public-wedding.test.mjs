import test from 'node:test'
import assert from 'node:assert/strict'
import { publicProject, isPublicWedding, PUBLIC_PROJECT_FIELDS } from '../lib/publicWedding.mjs'

test('public weddings require explicit paid and active states', () => {
  assert.equal(isPublicWedding({ payment_status: 'paid', project_status: 'active' }), true)
  for (const project of [null, {}, { payment_status: 'paid', project_status: 'onboarding' }, { payment_status: 'refunded', project_status: 'active' }, { payment_status: 'paid', project_status: 'inactive' }]) assert.equal(isPublicWedding(project), false)
})

test('guest project payload excludes billing, ownership, account and future private fields', () => {
  const record = Object.fromEntries(PUBLIC_PROJECT_FIELDS.map(key => [key, key]))
  Object.assign(record, { client_email: 'private@example.invalid', owner_user_id: 'owner', owner_id: 'owner', payment_status: 'paid', project_status: 'active', stripe_checkout_session_id: 'cs_private', new_private_column: 'secret' })
  assert.deepEqual(Object.keys(publicProject(record)), PUBLIC_PROJECT_FIELDS)
  assert.equal(JSON.stringify(publicProject(record)).includes('private'), false)
})
