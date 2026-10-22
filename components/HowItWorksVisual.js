'use client'

import { useEffect, useRef } from 'react'
import {
  DianaInvitationPrintTemplate,
  DianaQrCardPrintTemplate,
} from './DianaStationeryPrintTemplates'
import { getDianaStationeryData } from '../lib/dianaStationeryData'
import styles from './HowItWorksVisual.module.css'

const DIANA_PROJECT = {
  couple_display_name: 'Diana a Anton',
  wedding_date: '2027-09-18',
  ceremony_time: '15:00',
  venue_name: 'Kaplnka Božského Srdca Ježišovho',
  venue_address: 'Piešťany',
  reception_venue_name: 'Kursalon Piešťany',
}

const DIANA_STATIONERY = {
  ...getDianaStationeryData(DIANA_PROJECT, 'https://yesdaystudio.com/ukazka/web'),
  websiteDisplayUrl: 'yesdaystudio.com/ukazka/web',
}

export default function HowItWorksVisual() {
  const iframeRef = useRef(null)
  const timersRef = useRef([])

  useEffect(() => () => clearPhoneTimers(timersRef), [])

  function handleWebsiteLoad() {
    clearPhoneTimers(timersRef)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const frameWindow = iframeRef.current?.contentWindow
    const frameDocument = iframeRef.current?.contentDocument
    if (!frameWindow || !frameDocument) return

    if (!frameDocument.getElementById('yesday-phone-preview-scrollbars')) {
      const scrollbarStyles = frameDocument.createElement('style')
      scrollbarStyles.id = 'yesday-phone-preview-scrollbars'
      scrollbarStyles.textContent = `
        html, body { scrollbar-width: none; }
        html::-webkit-scrollbar, body::-webkit-scrollbar { width: 0; height: 0; display: none; }
      `
      frameDocument.head.appendChild(scrollbarStyles)
    }

    const scrollToSection = (id) => {
      const target = id ? frameDocument.getElementById(id) : null
      frameWindow.scrollTo({ top: target?.offsetTop || 0, behavior: 'smooth' })
    }

    const runSequence = () => {
      timersRef.current.push(window.setTimeout(() => scrollToSection(null), 180))
      timersRef.current.push(window.setTimeout(() => scrollToSection('info'), 3500))
      timersRef.current.push(window.setTimeout(() => scrollToSection('program'), 7500))
    }

    runSequence()
    timersRef.current.push(window.setInterval(runSequence, 11800))
  }

  return (
    <div className={styles.wrapper} aria-label="Pozvánka s QR kódom otvorí svadobný web v mobile">
      <div className={styles.scene}>
        <div className={styles.invitationShell}>
          <div className={styles.invitationScale}>
            <DianaInvitationPrintTemplate data={DIANA_STATIONERY} />
          </div>
        </div>

        <div className={styles.qrShell}>
          <div className={styles.qrScale}>
            <DianaQrCardPrintTemplate
              data={DIANA_STATIONERY}
              qrDataUrl="/yesday-demo-qr.svg"
            />
          </div>
          <div className={styles.scanLine} aria-hidden="true" />
        </div>

        <div className={styles.connection} aria-hidden="true">
          <span />
        </div>

        <div className={styles.phone}>
          <div className={styles.phoneSpeaker} />
          <div className={styles.phoneScreen}>
            <iframe
              ref={iframeRef}
              className={styles.phoneWebsite}
              src="/ukazka/web?design=diana"
              title="Mobilná ukážka svadobného webu Diana"
              loading="lazy"
              tabIndex="-1"
              onLoad={handleWebsiteLoad}
            />
          </div>
        </div>
      </div>

      <div className={styles.steps}>
        <div><span>01</span><p>Pozvánku a QR kód pošlete hosťom.</p></div>
        <div><span>02</span><p>V mobile nájdu web a vyplnia RSVP.</p></div>
        <div><span>03</span><p>Vy vidíte odpovede, ubytovanie aj požiadavky.</p></div>
      </div>
    </div>
  )
}

function clearPhoneTimers(timersRef) {
  timersRef.current.forEach((timer) => {
    window.clearTimeout(timer)
    window.clearInterval(timer)
  })
  timersRef.current = []
}
