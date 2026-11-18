'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './HomeMarketing.module.css'

const links = [['#ako-funguje', 'Ako to funguje'], ['#portfolio', 'Dizajny'], ['#cennik', 'Balíky'], ['#o-yesday', 'O YesDay'], ['/login', 'Klientska zóna']]

export default function HomeNavigation() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const close = event => { if (event.key === 'Escape') { setOpen(false); document.getElementById('yesday-menu-toggle')?.focus() } }
    if (open) document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [open])
  return <header className={styles.header}>
    <nav className={styles.navigation} aria-label="Hlavná navigácia">
      <Link href="/" className={styles.brand} aria-label="YesDay Studio — úvod">YES DAY <span>STUDIO</span></Link>
      <div className={styles.desktopLinks}>{links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</div>
      <button id="yesday-menu-toggle" type="button" className={styles.menuToggle} aria-expanded={open} aria-controls="yesday-mobile-menu" onClick={() => setOpen(value => !value)}><span>{open ? 'Zavrieť' : 'Menu'}</span><span aria-hidden="true">{open ? '×' : '☰'}</span></button>
      {open && <div id="yesday-mobile-menu" className={styles.mobileLinks}>{links.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}</div>}
    </nav>
  </header>
}
