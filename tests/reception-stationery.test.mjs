import test from 'node:test'
import assert from 'node:assert/strict'
import { getReceptionStationeryDetails } from '../lib/receptionStationery.mjs'

test('reception card uses celebration details instead of ceremony location and time', () => {
  const details = getReceptionStationeryDetails({ venue_name: 'Dóm sv. Martina', venue_address: 'Bratislava', ceremony_time: '15:00', reception_venue_name: 'Kaštieľ Belá', reception_venue_address: 'Belá 1', reception_time: '17:30:00', wedding_date: '2027-09-18' })
  assert.equal(details.name, 'Kaštieľ Belá')
  assert.equal(details.address, 'Belá 1')
  assert.equal(details.time, '17.30')
  assert.match(details.date, /18.*septembra.*2027/)
})
test('an unfilled celebration never prints a sample venue, date or ceremony details', () => {
  for (const value of [undefined, null, {}, { venue_name: 'Ceremony only', ceremony_time: '15:00' }]) {
    assert.deepEqual(getReceptionStationeryDetails(value), { name: '', address: '', date: '', time: '' })
  }
})
test('changing the celebration details replaces the original venue and preserves user wording', () => {
  const initial = { reception_venue_name: 'Pôvodné miesto' }
  const updated = getReceptionStationeryDetails({ ...initial, reception_venue_name: '  Záhrada u Novákovcov  ', reception_venue_address: '  Dolná 12, Trnava  ' })
  assert.equal(updated.name, 'Záhrada u Novákovcov')
  assert.equal(updated.address, 'Dolná 12, Trnava')
})
test('invalid dates and times are not replaced by invented wedding details', () => {
  const details = getReceptionStationeryDetails({ wedding_date: '2027-02-30', reception_time: '29:80' })
  assert.equal(details.date, '')
  assert.equal(details.time, '')
})
