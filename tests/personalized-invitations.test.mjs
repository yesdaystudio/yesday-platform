import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeInvitationToken, normalizePersonalizedRsvp } from '../lib/personalizedInvitations.mjs'

test('accepts only a 64 character hexadecimal invitation token', () => {
  const token = 'a1'.repeat(32)
  assert.equal(normalizeInvitationToken(token.toUpperCase()), token)
  assert.equal(normalizeInvitationToken('short-token'), '')
  assert.equal(normalizeInvitationToken('z'.repeat(64)), '')
})

test('normalizes an attending personalized RSVP and preserves current accommodation data', () => {
  const result = normalizePersonalizedRsvp({
    attending: 'yes',
    adults_count: 2,
    children_count: 1,
    people: [
      { name: ' Janka ', menu: 'vegetarian', allergies: 'orechy' },
      { name: 'Jožko', menu: 'meat', allergies: '' },
      { name: 'Hanka', menu: 'child', allergies: '' },
    ],
    needs_accommodation: true,
    transport: 'Odvoz z hotela',
    contact_email: 'host@example.com',
    contact_phone: '+421900000000',
    message: 'Tešíme sa',
  })

  assert.equal(result.error, undefined)
  assert.equal(result.value.guest_name, 'Janka')
  assert.equal(result.value.people.length, 3)
  assert.equal(result.value.people[2].type, 'child')
  assert.equal(result.value.people[0].transport_request, 'Odvoz z hotela')
  assert.equal(result.value.needs_accommodation, true)
})

test('rejects missing guest names instead of creating an incomplete linked response', () => {
  const result = normalizePersonalizedRsvp({
    attending: 'yes',
    adults_count: 2,
    children_count: 0,
    people: [{ name: 'Janka' }, { name: '' }],
  })
  assert.equal(result.error, 'Doplňte mená všetkých hostí.')
})

test('stores a decline without accommodation or guest people', () => {
  const result = normalizePersonalizedRsvp({
    attending: 'no',
    guest_name: 'Novákovci',
    adults_count: 4,
    needs_accommodation: true,
  })
  assert.equal(result.value.attending, 'no')
  assert.equal(result.value.adults_count, 0)
  assert.deepEqual(result.value.people, [])
  assert.equal(result.value.needs_accommodation, false)
})
