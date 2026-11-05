'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './DesignFamilyPreview.module.css'

const WIDTH = 1366
const HEIGHT = 900

export default function DesignFamilyPreview({ design, name, href }) {
  const container = useRef(null)
  const [width, setWidth] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [])

  return (
    <a ref={container} href={href} className={styles.preview} aria-label={`Vyskúšať svadobný dizajn ${name}`}>
      {!ready ? <span className={styles.loading} aria-hidden="true">{name}</span> : null}
      <iframe
        src={`/ukazka/web?design=${encodeURIComponent(design)}&preview=hero`}
        title={`Skutočný náhľad dizajnu ${name}`}
        loading="lazy"
        tabIndex={-1}
        aria-hidden="true"
        onLoad={() => setReady(true)}
        className={styles.frame}
        style={{ width: WIDTH, height: HEIGHT, transform: `scale(${width / WIDTH})`, opacity: ready && width ? 1 : 0 }}
      />
      <span className={styles.open}>Pozrieť dizajn ↗</span>
    </a>
  )
}
