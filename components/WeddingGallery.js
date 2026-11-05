'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './WeddingGallery.module.css'

export default function WeddingGallery({ gallery }) {
  const [index, setIndex] = useState(0)
  const dialog = useRef(null)
  const closeButton = useRef(null)
  const opener = useRef(null)
  const photos = gallery?.photos || []

  useEffect(() => {
    const node = dialog.current
    if (!node) return
    const restore = () => { document.body.style.overflow = previous; opener.current?.focus() }
    const previous = document.body.style.overflow
    node.addEventListener('close', restore)
    return () => { node.removeEventListener('close', restore); document.body.style.overflow = previous }
  }, [])

  if (!gallery?.published || !photos.length) return null
  const current = photos[index]

  function open(photoIndex, event) {
    opener.current = event.currentTarget
    setIndex(photoIndex)
    dialog.current.showModal()
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()
  }

  return (
    <section id="galeria" className={styles.gallery} aria-labelledby="wedding-gallery-title">
      <p className={styles.eyebrow}>Náš deň v obrazoch</p>
      <h2 id="wedding-gallery-title">{gallery.title}</h2>
      {gallery.introduction ? <p className={styles.introduction}>{gallery.introduction}</p> : null}
      <div className={styles.photoGrid}>
        {photos.map((photo, photoIndex) => <button key={photo.id} className={styles.photoButton} onClick={event => open(photoIndex, event)} aria-label={`Otvoriť fotografiu ${photoIndex + 1}${photo.caption ? `: ${photo.caption}` : ''}`}>
          <img src={photo.url} alt={photo.caption || `Spomienka zo svadby ${photoIndex + 1}`} loading="lazy" width={600} height={750} />
          {photo.caption ? <span>{photo.caption}</span> : null}
        </button>)}
      </div>
      <dialog ref={dialog} className={styles.lightbox} aria-label="Svadobné fotografie" onClick={event => { if (event.target === event.currentTarget) dialog.current.close() }} onKeyDown={event => {
        if (event.key === 'ArrowRight') { event.preventDefault(); setIndex((index + 1) % photos.length) }
        if (event.key === 'ArrowLeft') { event.preventDefault(); setIndex((index + photos.length - 1) % photos.length) }
      }}>
        <button ref={closeButton} className={styles.close} onClick={() => dialog.current.close()} aria-label="Zavrieť fotografiu">×</button>
        <figure>
          <img src={current.url} alt={current.caption || `Svadobná fotografia ${index + 1}`} />
          <figcaption aria-live="polite">{current.caption}<span>{index + 1} / {photos.length}</span></figcaption>
        </figure>
        {photos.length > 1 ? <div className={styles.navigation}><button onClick={() => setIndex((index + photos.length - 1) % photos.length)} aria-label="Predchádzajúca fotografia">←</button><button onClick={() => setIndex((index + 1) % photos.length)} aria-label="Nasledujúca fotografia">→</button></div> : null}
      </dialog>
    </section>
  )
}
