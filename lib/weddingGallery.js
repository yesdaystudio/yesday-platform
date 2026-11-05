import 'server-only'
import { getSupabaseAdmin } from './supabaseAdmin'
import { canUseGallery, GALLERY_BUCKET } from './galleryRules.mjs'

export async function readWeddingGallery(project, { owner = false } = {}) {
  if (!canUseGallery(project)) return null
  const db = getSupabaseAdmin()
  const { data: gallery, error } = await db.from('wedding_galleries').select('title,introduction,published').eq('project_id', project.id).maybeSingle()
  if (error) throw error
  if (!gallery || (!owner && !gallery.published)) return null
  const { data: photos, error: photoError } = await db.from('wedding_gallery_photos')
    .select('id,storage_path,caption,sort_order').eq('project_id', project.id).order('sort_order').order('created_at')
  if (photoError) throw photoError
  if (!photos.length) return { ...gallery, photos: [] }
  const { data: signed, error: signError } = await db.storage.from(GALLERY_BUCKET).createSignedUrls(photos.map(photo => photo.storage_path), 3600)
  if (signError || signed.some(item => !item.signedUrl)) throw signError || new Error('Gallery signing failed')
  return { ...gallery, photos: photos.map((photo, index) => ({ id: photo.id, caption: photo.caption, url: signed[index].signedUrl })) }
}
