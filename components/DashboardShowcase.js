'use client'

import { useState } from 'react'
import ClientDashboard from './ClientDashboard'
import ClientAccommodation from './ClientAccommodation'
import { createDemoState, DEMO_DEFAULTS, DEMO_RESPONSES } from '../lib/demoWedding'
import styles from './DashboardShowcase.module.css'

const DEMO_PROJECT = createDemoState(DEMO_DEFAULTS).project

export default function DashboardShowcase() {
  const [view, setView] = useState('guests')

  return (
    <section id="prehlad-pre-nevestu" className={styles.section} aria-labelledby="bride-view-title">
      <p className={styles.eyebrow}>A čo vidíte vy?</p>
      <h2 id="bride-view-title" className={styles.title}>Všetko pod kontrolou, bez chaotických tabuliek</h2>
      <p className={styles.intro}>
        Každá odpoveď hosťa sa automaticky zaradí do prehľadu. Okamžite vidíte,
        kto príde, čo potrebuje a komu ešte treba priradiť izbu.
      </p>

      <div className={styles.browser}>
        <div className={styles.browserBar} aria-hidden="true">
          <div className={styles.dots}><span /><span /><span /></div>
          <p>Klientska zóna · Diana a Anton</p>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Ukážka klientskej zóny">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'guests'}
            className={view === 'guests' ? styles.activeTab : ''}
            onClick={() => setView('guests')}
          >
            Prehľad hostí
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'accommodation'}
            className={view === 'accommodation' ? styles.activeTab : ''}
            onClick={() => setView('accommodation')}
          >
            Manažment ubytovania
          </button>
        </div>

        <p className={styles.hint}>
          {view === 'guests'
            ? 'Dospelí, deti, menu, alergie, doprava a požiadavky na ubytovanie na jednom mieste.'
            : 'Hotely vyplníte raz. Po priradení izby jedným klikom odošlete hosťovi e-mail s hotelom, adresou, check-inom, check-outom aj číslom izby.'}
        </p>

        <div className={styles.viewport} role="tabpanel">
          {view === 'guests' ? (
            <ClientDashboard demoProject={DEMO_PROJECT} demoResponses={DEMO_RESPONSES} />
          ) : (
            <ClientAccommodation
              demoProject={DEMO_PROJECT}
              demoResponses={DEMO_RESPONSES}
              onDemoResponseUpdate={() => {}}
            />
          )}
        </div>
      </div>
    </section>
  )
}
