import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildReminderEmailData,
  buildReminderIdempotencyKey,
  canUseAccommodation,
  getFinalDeliveryStatus,
  getReminderStatus,
  isReminderDueNow,
  requiresDateChangeConfirmation,
} from '../lib/accommodationReminderRules.mjs'

const now = new Date('2027-09-16T08:15:00.000Z')
const project = {
  id: 'project-1',
  slug: 'diana-anton',
  package_type: 'signature',
  wedding_date: '2027-09-18',
  timezone: 'Europe/Bratislava',
  payment_status: 'paid',
  project_status: 'active',
  couple_display_name: 'Diana a Anton',
  accommodation_reminder_days: 2,
  accommodation_reminder_setting_updated_at: '2027-08-01T10:00:00.000Z',
  accommodation_reminder_resend_confirmed_for_date: null,
}
const guest = {
  id: 'response-1',
  guest_name: 'Martina',
  contact_email: 'test@example.com',
  accommodation_option_id: 'hotel-1',
  accommodation_room: '204',
  accommodation_email_sent_at: '2027-08-20T10:00:00.000Z',
}
const accommodation = {
  id: 'hotel-1',
  name: 'Hotel Park',
  address: 'Hlavná 1, Piešťany',
  check_in: '18. 9. od 14:00',
  check_out: '19. 9. do 10:00',
  guest_note: 'Raňajky sú v cene.',
}

test('1. eligible guest is due two days before the wedding', () => {
  assert.equal(isReminderDueNow(project, now), true)
})

test('2. guest without assigned accommodation is excluded', () => {
  const state = getReminderStatus({
    project,
    guest: { ...guest, accommodation_option_id: null },
    now,
  })
  assert.equal(state.code, 'not_applicable')
  assert.match(state.detail, /priradené ubytovanie/)
})

test('3. guest without email is excluded', () => {
  const state = getReminderStatus({ project, guest: { ...guest, contact_email: null }, now })
  assert.equal(state.code, 'not_applicable')
  assert.match(state.detail, /e-mailovú adresu/)
})

test('4. current room is used when reminder content is built', () => {
  const changedGuest = { ...guest, accommodation_room: '305' }
  const data = buildReminderEmailData({ project, guest: changedGuest, accommodation, siteUrl: 'https://yesdaystudio.com/' })
  assert.equal(data.room, '305')
  assert.equal(data.websiteUrl, 'https://yesdaystudio.com/diana-anton')
})

test('5. changed wedding date automatically changes the due date before any reminder was sent', () => {
  const changedProject = { ...project, wedding_date: '2027-09-19' }
  assert.equal(isReminderDueNow(changedProject, now), false)
  assert.equal(isReminderDueNow(changedProject, new Date('2027-09-17T08:15:00.000Z')), true)
})

test('6. disabled reminders are never due', () => {
  assert.equal(isReminderDueNow({ ...project, accommodation_reminder_days: null }, now), false)
})

test('7. repeated cron runs use the same idempotency key', () => {
  const input = { projectId: project.id, responseId: guest.id, weddingDate: project.wedding_date }
  assert.equal(buildReminderIdempotencyKey(input), buildReminderIdempotencyKey(input))
})

test('8. uncertain delivery is stopped for manual review', () => {
  assert.equal(getFinalDeliveryStatus({ deliveryUncertain: true }), 'needs_review')
  assert.equal(getFinalDeliveryStatus({ deliveryUncertain: false }), 'failed')
})

test('9. a past wedding is not presented as scheduled', () => {
  const state = getReminderStatus({
    project: { ...project, wedding_date: '2027-09-15' },
    guest,
    now,
  })
  assert.equal(state.code, 'expired')
})

test('10. guests sharing a room still have separate delivery keys', () => {
  const first = buildReminderIdempotencyKey({ projectId: project.id, responseId: 'response-1', weddingDate: project.wedding_date })
  const second = buildReminderIdempotencyKey({ projectId: project.id, responseId: 'response-2', weddingDate: project.wedding_date })
  assert.notEqual(first, second)
})

test('an initial accommodation email is required', () => {
  const state = getReminderStatus({
    project,
    guest: { ...guest, accommodation_email_sent_at: null },
    now,
  })
  assert.equal(state.code, 'not_applicable')
  assert.match(state.label, /Najprv odošlite/)
})

test('Essential cannot use accommodation reminders while Signature and Atelier can', () => {
  assert.equal(canUseAccommodation('essential'), false)
  assert.equal(canUseAccommodation('signature'), true)
  assert.equal(canUseAccommodation('atelier'), true)
})

test('a reminder is not resent after the wedding date changes without explicit confirmation', () => {
  const deliveries = [{
    rsvp_response_id: guest.id,
    wedding_date: '2027-09-17',
    status: 'accepted',
    accepted_at: '2027-09-15T08:10:00.000Z',
  }]
  assert.equal(requiresDateChangeConfirmation(project, deliveries), true)
  const blocked = getReminderStatus({ project, guest, deliveries, now })
  assert.equal(blocked.code, 'confirmation_required')

  const confirmedProject = {
    ...project,
    accommodation_reminder_resend_confirmed_for_date: project.wedding_date,
  }
  assert.equal(requiresDateChangeConfirmation(confirmedProject, deliveries), false)
})

test('a setting enabled after the scheduled start is marked as missed', () => {
  const lateProject = {
    ...project,
    accommodation_reminder_setting_updated_at: '2027-09-16T08:05:00.000Z',
  }
  assert.equal(isReminderDueNow(lateProject, now), false)
  const state = getReminderStatus({ project: lateProject, guest, now })
  assert.equal(state.code, 'missed')
})

test('inactive and unpaid projects are excluded', () => {
  assert.equal(isReminderDueNow({ ...project, project_status: 'inactive' }, now), false)
  assert.equal(isReminderDueNow({ ...project, payment_status: 'unpaid' }, now), false)
})
