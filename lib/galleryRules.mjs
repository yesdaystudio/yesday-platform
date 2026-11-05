export const GALLERY_LIMIT = 100
export const GALLERY_MAX_BYTES = 2 * 1024 * 1024
export const GALLERY_BUCKET = 'wedding-gallery'

export function canUseGallery(project) {
  return ['signature', 'atelier'].includes(String(project?.package_type || '').toLowerCase())
    && project?.payment_status === 'paid' && project?.project_status === 'active'
}

export function galleryText(value, max) {
  return String(value || '').trim().slice(0, max)
}

export function isGalleryJpeg(bytes) {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
}

export function validGalleryOrder(ids, existing) {
  return Array.isArray(ids) && ids.length === existing.length
    && new Set(ids).size === ids.length && ids.every(id => existing.includes(id))
}
