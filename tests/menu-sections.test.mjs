import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createDefaultMenuSections,
  getVisibleMenuSections,
  normalizeMenuSections,
  serializeMenuSections,
} from '../lib/menuSections.mjs'

test('new menu starts with editable courses enabled', () => {
  const sections = createDefaultMenuSections()

  assert.deepEqual(sections.map(({ label, enabled }) => ({ label, enabled })), [
    { label: 'Predjedlo', enabled: true },
    { label: 'Polievka', enabled: true },
    { label: 'Hlavné jedlo', enabled: true },
    { label: 'Dezert', enabled: true },
  ])
})

test('legacy menu is split into its existing courses without enabling missing ones', () => {
  const sections = normalizeMenuSections(null, `PREDJEDLO
Sezónny šalát

HLAVNÉ JEDLO
Hovädzie líčka

DEZERT
Svadobná torta`)

  assert.equal(sections.find((item) => item.key === 'starter').text, 'Sezónny šalát')
  assert.equal(sections.find((item) => item.key === 'soup').enabled, false)
  assert.equal(sections.find((item) => item.key === 'main').text, 'Hovädzie líčka')
  assert.equal(sections.find((item) => item.key === 'dessert').text, 'Svadobná torta')
})

test('disabled and empty courses stay hidden from the wedding website', () => {
  const content = {
    menu_sections: {
      configured: true,
      items: [
        { key: 'starter', enabled: false, text: 'Tatarák' },
        { key: 'soup', enabled: true, text: '' },
        { key: 'main', enabled: true, text: 'Kačacie prsia' },
        { key: 'dessert', enabled: true, text: 'Torta' },
      ],
    },
  }

  assert.deepEqual(getVisibleMenuSections(content).map((item) => item.key), ['main', 'dessert'])
  assert.equal(serializeMenuSections(content.menu_sections.items), 'HLAVNÉ JEDLO\nKačacie prsia\n\nDEZERT\nTorta')
})

test('unstructured legacy text remains available under the main course', () => {
  const sections = normalizeMenuSections(null, 'Menu podľa výberu hostí')

  assert.deepEqual(getVisibleMenuSections({ menu_intro_text: 'Menu podľa výberu hostí' }).map((item) => item.key), ['main'])
  assert.equal(sections.find((item) => item.key === 'main').text, 'Menu podľa výberu hostí')
})
