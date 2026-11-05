import { canUseGallery, galleryText, GALLERY_BUCKET, GALLERY_MAX_BYTES, isGalleryJpeg, validGalleryOrder } from './galleryRules.mjs'

export function createGalleryHandlers({ getSupabaseAdmin, readWeddingGallery, randomUUID }) {

const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

async function authorize(request, context) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
  if (!token) return { response: reply({ error: 'Prihláste sa, prosím.' }, 401) }
  const db = getSupabaseAdmin()
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) return { response: reply({ error: 'Prihlásenie vypršalo.' }, 401) }
  const { slug } = await context.params
  const { data: project, error: projectError } = await db.from('projects')
    .select('id,owner_user_id,package_type,payment_status,project_status').eq('slug', slug).eq('owner_user_id', data.user.id).maybeSingle()
  if (projectError) throw projectError
  if (!project) return { response: reply({ error: 'Projekt nie je dostupný.' }, 404) }
  if (!canUseGallery(project)) return { response: reply({ error: 'Galéria je dostupná pre aktívny zaplatený balík Signature alebo Atelier.' }, 403) }
  return { db, project }
}

async function handle(request, context, action) {
  try {
    const access = await authorize(request, context)
    if (access.response) return access.response
    return await action(access)
  } catch (error) {
    console.error('Wedding gallery request failed:', error.code || error.name || 'unknown')
    return reply({ error: 'Galériu sa nepodarilo uložiť alebo načítať. Skúste to znovu.' }, 503)
  }
}

async function GET(request, context) {
  return handle(request, context, async ({ project }) => reply({ gallery: await readWeddingGallery(project, { owner: true }) }))
}

async function POST(request, context) {
  return handle(request, context, async ({ db, project }) => {
    if (request.headers.get('content-type')?.startsWith('multipart/form-data')) {
      if (Number(request.headers.get('content-length')) > 3 * 1024 * 1024) return reply({ error: 'Fotografia je príliš veľká.' }, 413)
      const form = await request.formData()
      const file = form.get('photo')
      if (!file || typeof file.arrayBuffer !== 'function' || file.type !== 'image/jpeg' || file.size > GALLERY_MAX_BYTES) return reply({ error: 'Nahrajte JPEG do 2 MB.' }, 400)
      const bytes = new Uint8Array(await file.arrayBuffer())
      if (!isGalleryJpeg(bytes)) return reply({ error: 'Súbor nie je platná JPEG fotografia.' }, 400)
      const { error: initError } = await db.from('wedding_galleries').upsert({ project_id: project.id }, { onConflict: 'project_id', ignoreDuplicates: true })
      if (initError) throw initError
      const id = randomUUID()
      const path = `${project.id}/${id}.jpg`
      const { error: uploadError } = await db.storage.from(GALLERY_BUCKET).upload(path, bytes, { contentType: 'image/jpeg', cacheControl: '300', upsert: false })
      if (uploadError) throw uploadError
      const { data: last } = await db.from('wedding_gallery_photos').select('sort_order').eq('project_id', project.id).order('sort_order', { ascending: false }).limit(1)
      const { error: insertError } = await db.from('wedding_gallery_photos').insert({ id, project_id: project.id, storage_path: path, sort_order: (last?.[0]?.sort_order || 0) + 1 })
      if (insertError) {
        const { error: cleanupError } = await db.storage.from(GALLERY_BUCKET).remove([path])
        if (cleanupError) console.error('Gallery upload cleanup required', project.id, id)
        if (insertError.code === '23514') return reply({ error: 'Galéria môže obsahovať najviac 100 fotografií.' }, 409)
        throw insertError
      }
      return reply({ ok: true })
    }
    let body
    try { body = await request.json() } catch { return reply({ error: 'Neplatné údaje.' }, 400) }
    if (body.action === 'settings') {
      if (typeof body.published !== 'boolean') return reply({ error: 'Neplatné nastavenie zverejnenia.' }, 400)
      const { error } = await db.from('wedding_galleries').upsert({ project_id: project.id, title: galleryText(body.title, 100) || 'Spomienky na náš deň', introduction: galleryText(body.introduction, 600), published: body.published })
      if (error) throw error
    } else if (body.action === 'caption') {
      const { data, error } = await db.from('wedding_gallery_photos').update({ caption: galleryText(body.caption, 180) }).eq('id', body.id).eq('project_id', project.id).select('id').maybeSingle()
      if (error) throw error
      if (!data) return reply({ error: 'Fotografia sa nenašla.' }, 404)
    } else if (body.action === 'reorder') {
      const { data, error } = await db.from('wedding_gallery_photos').select('id').eq('project_id', project.id)
      if (error) throw error
      if (!validGalleryOrder(body.ids, data.map(photo => photo.id))) return reply({ error: 'Obsah galérie sa zmenil. Obnovte stránku.' }, 409)
      const { error: orderError } = await db.rpc('reorder_wedding_gallery', { p_project_id: project.id, p_ids: body.ids })
      if (orderError) return reply({ error: 'Poradie sa nepodarilo uložiť. Obnovte galériu.' }, 409)
    } else return reply({ error: 'Neznáma požiadavka.' }, 400)
    return reply({ ok: true })
  })
}

async function DELETE(request, context) {
  return handle(request, context, async ({ db, project }) => {
    let body
    try { body = await request.json() } catch { return reply({ error: 'Neplatné údaje.' }, 400) }
    const { data: photo, error } = await db.from('wedding_gallery_photos').select('storage_path').eq('id', body.id).eq('project_id', project.id).maybeSingle()
    if (error) throw error
    if (!photo) return reply({ error: 'Fotografia sa nenašla.' }, 404)
    const { error: storageError } = await db.storage.from(GALLERY_BUCKET).remove([photo.storage_path])
    if (storageError) throw storageError
    const { error: deleteError } = await db.from('wedding_gallery_photos').delete().eq('id', body.id).eq('project_id', project.id)
    if (deleteError) throw deleteError
    return reply({ ok: true })
  })
}
return { GET, POST, DELETE }
}
