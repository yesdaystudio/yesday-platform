'use client'

import { useEffect, useState } from 'react'
import supabase from '../lib/supabase'
import { GALLERY_LIMIT, GALLERY_MAX_BYTES } from '../lib/galleryRules.mjs'
import styles from './WeddingGallery.module.css'

const EMPTY = { title: 'Spomienky na náš deň', introduction: '', published: false, photos: [] }

export default function ClientGallery({ slug }) {
  const [gallery, setGallery] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  async function request(options = {}) {
    const { data } = await supabase.auth.getSession()
    if (!data.session) throw new Error('Prihláste sa znovu, prosím.')
    const response = await fetch(`/api/gallery/${encodeURIComponent(slug)}`, {
      ...options,
      headers: { Authorization: `Bearer ${data.session.access_token}`, ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers },
      cache: 'no-store',
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.error || 'Galéria nie je dostupná. Skúste to znovu.')
    return body
  }

  async function reload(preserveSettings = false) {
    const body = await request()
    setGallery(current => preserveSettings ? { ...current, photos: body.gallery?.photos || [] } : body.gallery || EMPTY)
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    request().then(body => { if (!cancelled) setGallery(body.gallery || EMPTY) })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug]) // A new project must always reload its own gallery.

  async function perform(action, success, preserveSettings = true) {
    setBusy(true); setError(''); setMessage('')
    try { await action(); await reload(preserveSettings); setMessage(success) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  function saveSettings(event) {
    event.preventDefault()
    perform(() => request({ method: 'POST', body: JSON.stringify({ action: 'settings', ...gallery, photos: undefined }) }), 'Nastavenia galérie sú uložené.', false)
  }

  async function upload(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    if (files.length + gallery.photos.length > GALLERY_LIMIT) { setError(`Môžete nahrať ešte ${GALLERY_LIMIT - gallery.photos.length} fotografií.`); return }
    setBusy(true); setError(''); setMessage('')
    let uploaded = 0
    try {
      for (const file of files) {
        setMessage(`Pripravujem fotografiu ${uploaded + 1} z ${files.length}…`)
        const photo = await prepareGalleryPhoto(file)
        const body = new FormData()
        body.append('photo', photo, 'wedding.jpg')
        await request({ method: 'POST', body })
        uploaded += 1
      }
      setMessage(`Nahrané fotografie: ${uploaded}.`)
    } catch (err) { setError(`${err.message}${uploaded ? ` Už nahrané fotografie: ${uploaded}.` : ''}`); setMessage('') }
    finally {
      // Preserve unsaved title/visibility when adding photos.
      try { const body = await request(); setGallery(current => ({ ...current, photos: body.gallery?.photos || [] })) }
      catch (err) { setError(err.message) }
      setBusy(false)
    }
  }

  function move(index, direction) {
    const photos = [...gallery.photos]
    ;[photos[index], photos[index + direction]] = [photos[index + direction], photos[index]]
    perform(() => request({ method: 'POST', body: JSON.stringify({ action: 'reorder', ids: photos.map(photo => photo.id) }) }), 'Poradie fotografií je uložené.')
  }

  if (loading) return <p role="status">Načítavam galériu…</p>

  return (
    <section className={styles.manager}>
      <p className={styles.eyebrow}>Po svadbe</p>
      <h2>Vaše spoločné spomienky</h2>
      <p>Nahrajte fotografie a podeľte sa o svoj deň s hosťami na rovnakom svadobnom webe.</p>
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      <form onSubmit={saveSettings} className={styles.settings}>
        <label>Názov galérie<input required maxLength={100} value={gallery.title} disabled={busy} onChange={event => setGallery({ ...gallery, title: event.target.value })} /></label>
        <label>Úvodný text<textarea maxLength={600} rows={3} value={gallery.introduction} disabled={busy} onChange={event => setGallery({ ...gallery, introduction: event.target.value })} placeholder="Ďakujeme, že ste boli súčasťou nášho dňa." /></label>
        <label className={styles.checkbox}><input type="checkbox" checked={gallery.published} disabled={busy} onChange={event => setGallery({ ...gallery, published: event.target.checked })} />Zobraziť galériu na svadobnom webe</label>
        <p className={styles.hint}>Po zverejnení uvidia fotografie návštevníci vášho svadobného webu. Nahrajte len fotografie, ktoré môžete takto zdieľať. Vypnutie skryje galériu; už otvorené odkazy na fotografie môžu fungovať najviac hodinu.</p>
        <button disabled={busy} type="submit">Uložiť nastavenia</button>
      </form>
      <div className={styles.upload}>
        <h3>Fotografie <small>{gallery.photos.length} / {GALLERY_LIMIT}</small></h3>
        <p>JPG, PNG alebo WebP. Fotografie automaticky zmenšíme pre web; originály si ponechajte u seba.</p>
        <label className={styles.fileLabel}>Pridať fotografie<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy || gallery.photos.length >= GALLERY_LIMIT} onChange={upload} /></label>
      </div>
      {!gallery.photos.length ? <p>Zatiaľ tu nie sú fotografie. Pridajte prvé spomienky zo svadby.</p> : null}
      <div className={styles.editGrid}>
        {gallery.photos.map((photo, index) => (
          <article className={styles.editCard} key={photo.id}>
            {/* Signed URLs point at the private gallery bucket. */}
            <img src={photo.url} alt={photo.caption || `Svadobná fotografia ${index + 1}`} loading="lazy" />
            <label>Popis fotografie<input maxLength={180} value={photo.caption} disabled={busy} onChange={event => setGallery({ ...gallery, photos: gallery.photos.map(item => item.id === photo.id ? { ...item, caption: event.target.value } : item) })} /></label>
            <div className={styles.actions}>
              <button disabled={busy} onClick={() => perform(() => request({ method: 'POST', body: JSON.stringify({ action: 'caption', id: photo.id, caption: photo.caption }) }), 'Popis je uložený.')}>Uložiť popis</button>
              <button aria-label={`Posunúť fotografiu ${index + 1} skôr`} disabled={busy || index === 0} onClick={() => move(index, -1)}>↑</button>
              <button aria-label={`Posunúť fotografiu ${index + 1} neskôr`} disabled={busy || index === gallery.photos.length - 1} onClick={() => move(index, 1)}>↓</button>
              <button disabled={busy} onClick={() => setDeleteId(photo.id)}>Odstrániť</button>
            </div>
            {deleteId === photo.id ? <div className={styles.confirm}>
              <p>Odstrániť túto fotografiu z galérie?</p>
              <button disabled={busy} onClick={() => perform(async () => { await request({ method: 'DELETE', body: JSON.stringify({ id: photo.id }) }); setDeleteId(null) }, 'Fotografia je odstránená.')}>Áno, odstrániť</button>
              <button disabled={busy} onClick={() => setDeleteId(null)}>Ponechať</button>
            </div> : null}
          </article>
        ))}
      </div>
    </section>
  )
}

async function prepareGalleryPhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Použite JPG, PNG alebo WebP. HEIC najprv exportujte ako JPG.')
  if (file.size > 25 * 1024 * 1024) throw new Error('Zdrojová fotografia môže mať najviac 25 MB.')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const ratio = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio))
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    let blob
    for (const quality of [0.85, 0.7, 0.5]) {
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
      if (blob && blob.size <= GALLERY_MAX_BYTES) return blob
    }
    throw new Error('Fotografiu sa nepodarilo dostatočne zmenšiť.')
  } finally { URL.revokeObjectURL(url) }
}
