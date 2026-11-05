import assert from 'node:assert/strict'
import test from 'node:test'
import { createDemoState, readDemoState, demoUrlParams, demoFormValues } from '../lib/demoWedding.js'

test('a refresh restores Veno after switching away from Fleurie', () => {
  const data = createDemoState({ design: 'fleurie', first: 'Ema', second: 'Juraj' })
  data.project.design_family = 'veno'
  data.project.design_font_variant = 'editorial'
  data.project.design_text_color = 'secondary'
  const url = new URL('http://localhost/ukazka?design=fleurie&packed=stale#program')
  url.search = demoUrlParams(data, 'stationery').toString()
  const params = Object.fromEntries(url.searchParams)
  assert.equal(params.design, 'veno')
  assert.equal(url.searchParams.has('packed'), false)
  assert.equal(params.tab, 'stationery')
  assert.equal(url.hash, '#program')
  const restored = readDemoState(params)
  assert.equal(restored.project.design_family, 'veno')
  assert.equal(restored.project.design_font_variant, 'editorial')
  assert.equal(restored.project.design_text_color, 'secondary')
  assert.deepEqual(demoFormValues(restored), demoFormValues(data))
})

test('the current program and edits survive reloading the demo URL', () => {
  const data = createDemoState({ design: 'veno', first: 'Marína', second: 'Matej' })
  data.schedule.push({ item_time: '23:00', item_title: 'Čepčenie', item_description: 'Spoločná oslava' })
  data.content.story_text = 'Náš upravený príbeh.'
  const restored = readDemoState(Object.fromEntries(demoUrlParams(data)))
  assert.deepEqual(restored.schedule, data.schedule)
  assert.equal(restored.content.story_text, data.content.story_text)
  assert.equal(demoFormValues(restored).first, 'Marína')
})

test('demo links omit guest responses and accommodation data', () => {
  const data = createDemoState({ design: 'veno' })
  data.responses = [{ contact_email: 'private@example.com' }]
  data.accommodation = [{ room: '204' }]
  const details = JSON.parse(demoUrlParams(data).get('details'))
  assert.deepEqual(Object.keys(details), ['project', 'content', 'schedule'])
  assert.equal(JSON.stringify(details).includes('private@example.com'), false)
})
