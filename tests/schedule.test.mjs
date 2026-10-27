import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createDefaultScheduleItems,
  withDefaultScheduleItems,
} from '../lib/schedule.js'

test('an empty schedule starts with ceremony and celebration', () => {
  const items = createDefaultScheduleItems({
    ceremony_time: '14:30:00',
    reception_time: '17:00:00',
    venue_name: 'Kostol sv. Anny',
    reception_venue_name: 'Kaštieľ',
  })

  assert.deepEqual(items, [
    { item_time: '14:30', item_title: 'Svadobný obrad', item_description: 'Kostol sv. Anny' },
    { item_time: '17:00', item_title: 'Svadobná oslava', item_description: 'Kaštieľ' },
  ])
})

test('an existing schedule is kept unchanged', () => {
  const existing = [{ item_time: '20:00', item_title: 'Prvý tanec', item_description: '' }]

  assert.equal(withDefaultScheduleItems(existing, {}), existing)
})
