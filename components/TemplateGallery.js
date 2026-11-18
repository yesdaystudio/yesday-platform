'use client'

import { useRef, useState } from 'react'
import styles from './HomeMarketing.module.css'

export default function TemplateGallery({ children, count }) {
  const ref = useRef(null)
  const [active, setActive] = useState(0)
  function sync() {
    const element = ref.current
    const items = element?.children
    if (!items?.length) return
    let closest = 0
    let distance = Infinity
    Array.from(items).forEach((item, index) => {
      const difference = Math.abs(item.offsetLeft - items[0].offsetLeft - element.scrollLeft)
      if (difference < distance) { closest = index; distance = difference }
    })
    setActive(closest)
  }
  function move(direction) {
    const element = ref.current
    const index = Math.max(0, Math.min(count - 1, active + direction))
    const target = element?.children[index]
    if (target) element.scrollTo({ left: target.offsetLeft - element.children[0].offsetLeft, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  return <div className={styles.galleryShell}>
    <p className={styles.swipeHint}>Posuňte dizajny prstom alebo použite šípky.</p>
    <div ref={ref} className={styles.gallery} onScroll={sync} aria-label="Svadobné dizajny">{children}</div>
    <div className={styles.galleryControls}><button type="button" onClick={() => move(-1)} disabled={active === 0} aria-label="Predchádzajúci dizajn">←</button><span aria-live="polite">{active + 1} / {count} dizajnov</span><button type="button" onClick={() => move(1)} disabled={active === count - 1} aria-label="Nasledujúci dizajn">→</button></div>
  </div>
}
