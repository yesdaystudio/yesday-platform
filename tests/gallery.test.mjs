import test from 'node:test'
import assert from 'node:assert/strict'
import { canUseGallery, validGalleryOrder, isGalleryJpeg, galleryText } from '../lib/galleryRules.mjs'

test('gallery access requires a paid active Signature or Atelier project', () => {
  const project = { package_type: 'signature', payment_status: 'paid', project_status: 'active' }
  assert.equal(canUseGallery(project), true)
  assert.equal(canUseGallery({ ...project, package_type: 'atelier' }), true)
  for (const patch of [{ package_type: 'essential' }, { payment_status: 'refunded' }, { payment_status: null }, { project_status: 'inactive' }, { project_status: null }]) {
    assert.equal(canUseGallery({ ...project, ...patch }), false)
  }
  assert.equal(canUseGallery(null), false)
})

test('reordering rejects duplicate, foreign, missing, and stale photo lists', () => {
  assert.equal(validGalleryOrder(['b', 'a'], ['a', 'b']), true)
  for (const ids of [['a', 'a'], ['a', 'c'], ['a'], ['a', 'b', 'c'], null]) assert.equal(validGalleryOrder(ids, ['a', 'b']), false)
  assert.equal(validGalleryOrder([], []), true)
})

test('gallery rejects disguised SVG and bounds captions', () => {
  assert.equal(isGalleryJpeg(new TextEncoder().encode('<svg onload="alert(1)"/>')), false)
  assert.equal(isGalleryJpeg(new Uint8Array([255, 216, 255, 224])), true)
  assert.equal(galleryText('  Náš deň  ', 180), 'Náš deň')
  assert.equal(galleryText('a'.repeat(300), 180).length, 180)
})
