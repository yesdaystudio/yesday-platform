'use client'

import { useState } from 'react'
import styles from './botanique-concept.module.css'

const LEFT_BLOOMS = [
  [75, 600, 0.82], [112, 548, 0.68], [142, 510, 0.9], [166, 454, 0.62],
  [205, 420, 0.82], [234, 365, 0.66], [282, 330, 0.92], [315, 270, 0.64],
  [353, 230, 0.82], [391, 179, 0.62], [430, 148, 0.84], [255, 470, 0.55],
  [330, 390, 0.58], [380, 310, 0.64], [448, 246, 0.58],
]

const RIGHT_BLOOMS = [
  [1122, 646, 0.84], [1088, 594, 0.62], [1052, 552, 0.88], [1023, 492, 0.64],
  [978, 452, 0.82], [950, 392, 0.58], [904, 354, 0.9], [878, 292, 0.64],
  [836, 254, 0.84], [804, 198, 0.58], [760, 162, 0.76], [994, 560, 0.54],
  [930, 490, 0.6], [870, 420, 0.56], [810, 338, 0.62],
]

const TOP_BLOOMS = [
  [970, 68, 0.6], [1012, 86, 0.82], [1057, 103, 0.58], [1095, 132, 0.72],
  [1138, 153, 0.54], [1182, 184, 0.68], [1062, 48, 0.48], [1120, 82, 0.5],
]

export default function BotaniqueHeroConcept() {
  const [viewport, setViewport] = useState('desktop')

  return (
    <main className={styles.reviewPage}>
      <header className={styles.reviewHeader}>
        <div>
          <span>YesDay Studio · dizajnový návrh 01</span>
          <strong>Botanique — Fine Art Botanical</strong>
        </div>
        <div className={styles.viewSwitch} aria-label="Veľkosť náhľadu">
          <button type="button" aria-pressed={viewport === 'desktop'} onClick={() => setViewport('desktop')}>Desktop</button>
          <button type="button" aria-pressed={viewport === 'mobile'} onClick={() => setViewport('mobile')}>Mobil</button>
        </div>
      </header>

      <section className={styles.reviewIntro}>
        <p>Prvý smer hero sekcie</p>
        <h1>Pokojná botanická kompozícia bez fotografického pozadia</h1>
      </section>

      <div className={`${styles.stage} ${viewport === 'mobile' ? styles.stageMobile : styles.stageDesktop}`}>
        <BotaniqueHero compact={viewport === 'mobile'} />
      </div>

      <section className={styles.conceptNotes} aria-label="Vizuálne rozhodnutia">
        <div>
          <span>01</span>
          <strong>Prírodný papier</strong>
          <p>Teplý ivory základ s veľmi jemnou štruktúrou a bez digitálneho gradientu.</p>
        </div>
        <div>
          <span>02</span>
          <strong>Gypsomilka vo vetre</strong>
          <p>Samostatné stonky sa pohybujú pomaly z prirodzeného bodu ukotvenia.</p>
        </div>
        <div>
          <span>03</span>
          <strong>Typografia ako hlavný motív</strong>
          <p>Mená zostávajú dominantné a ilustrácia im vytvára priestor namiesto rámčeka.</p>
        </div>
      </section>

      <section className={styles.palette} aria-label="Farebná paleta">
        <p>Navrhovaná paleta</p>
        <div><i style={{ background: '#f4f0e5' }} /><span>Warm ivory</span></div>
        <div><i style={{ background: '#d8d1bd' }} /><span>Natural linen</span></div>
        <div><i style={{ background: '#98a18d' }} /><span>Soft sage</span></div>
        <div><i style={{ background: '#536052' }} /><span>Olive leaf</span></div>
        <div><i style={{ background: '#303c32' }} /><span>Deep botanical</span></div>
      </section>
    </main>
  )
}

function BotaniqueHero({ compact }) {
  return (
    <article className={`${styles.hero} ${compact ? styles.heroCompact : ''}`}>
      <div className={styles.paperGrain} aria-hidden="true" />
      <BotanicalArtwork />

      <nav className={styles.heroNav} aria-label="Náhľad navigácie">
        <span className={styles.monogram}>L · M</span>
        <div>
          <span>O nás</span>
          <span>Program</span>
          <span>RSVP</span>
        </div>
      </nav>

      <div className={styles.heroCopy}>
        <p className={styles.kicker}>S radosťou vás pozývame</p>
        <h2><span>Laura</span><i>&amp;</i><span>Matej</span></h2>
        <div className={styles.dateLine}><b />18 · 09 · 2027<b /></div>
        <p className={styles.location}>Piešťany</p>
      </div>

      <div className={styles.scrollCue} aria-hidden="true"><span /></div>
    </article>
  )
}

function BotanicalArtwork() {
  return (
    <svg className={styles.botanicalArt} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <g id="botanique-bloom">
          <circle cx="0" cy="-5.2" r="4.2" />
          <circle cx="4.8" cy="-1.4" r="3.8" />
          <circle cx="2.7" cy="4.2" r="3.6" />
          <circle cx="-3.8" cy="3.6" r="3.9" />
          <circle cx="-4.7" cy="-1.8" r="3.5" />
          <circle className={styles.bloomCenter} r="1.25" />
        </g>
      </defs>

      <g className={`${styles.stemGroup} ${styles.stemLeft}`}>
        <path className={styles.mainStem} d="M-22 790 C 58 678, 120 585, 184 488 C 246 394, 320 278, 462 126" />
        <path d="M104 608 C 102 568, 88 536, 68 505" />
        <path d="M150 540 C 170 506, 190 479, 220 452" />
        <path d="M205 460 C 199 417, 181 382, 160 352" />
        <path d="M254 388 C 287 368, 315 345, 334 311" />
        <path d="M303 315 C 297 280, 286 247, 269 218" />
        <path d="M350 257 C 384 239, 412 214, 430 181" />
        <path d="M382 218 C 381 187, 372 158, 356 132" />
        {LEFT_BLOOMS.map(([x, y, scale], index) => (
          <use key={`left-${index}`} href="#botanique-bloom" transform={`translate(${x} ${y}) scale(${scale}) rotate(${index * 19})`} />
        ))}
      </g>

      <g className={`${styles.stemGroup} ${styles.stemRight}`}>
        <path className={styles.mainStem} d="M1218 806 C 1150 690, 1080 592, 1012 494 C 944 396, 870 278, 742 140" />
        <path d="M1108 628 C 1115 588, 1132 552, 1155 524" />
        <path d="M1064 566 C 1039 538, 1018 512, 994 480" />
        <path d="M1011 490 C 1019 447, 1038 412, 1060 382" />
        <path d="M958 414 C 929 391, 902 367, 884 335" />
        <path d="M910 342 C 918 306, 930 275, 949 245" />
        <path d="M860 276 C 826 255, 800 230, 781 198" />
        <path d="M822 231 C 824 198, 835 168, 851 143" />
        {RIGHT_BLOOMS.map(([x, y, scale], index) => (
          <use key={`right-${index}`} href="#botanique-bloom" transform={`translate(${x} ${y}) scale(${scale}) rotate(${-index * 17})`} />
        ))}
      </g>

      <g className={`${styles.stemGroup} ${styles.stemTop}`}>
        <path className={styles.mainStem} d="M1220 214 C 1149 168, 1088 120, 944 54" />
        <path d="M1124 151 C 1121 116, 1128 84, 1143 54" />
        <path d="M1062 118 C 1043 92, 1019 73, 991 61" />
        {TOP_BLOOMS.map(([x, y, scale], index) => (
          <use key={`top-${index}`} href="#botanique-bloom" transform={`translate(${x} ${y}) scale(${scale}) rotate(${index * 23})`} />
        ))}
      </g>
    </svg>
  )
}
