import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeRsvpSubmissionKey } from '../lib/rsvpSubmission.mjs'

test('accepts a valid browser generated RSVP submission key', () => {
  assert.equal(
    normalizeRsvpSubmissionKey('550E8400-E29B-41D4-A716-446655440000'),
    '550e8400-e29b-41d4-a716-446655440000'
  )
})

test('rejects missing and malformed RSVP submission keys', () => {
  assert.equal(normalizeRsvpSubmissionKey(''), '')
  assert.equal(normalizeRsvpSubmissionKey('same-guest'), '')
})
