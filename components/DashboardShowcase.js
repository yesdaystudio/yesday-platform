'use client'

import { useState } from 'react'
import Link from 'next/link'
import ClientDashboard from './ClientDashboard'
import ClientAccommodation, { buildAccommodationEmailDraft } from './ClientAccommodation'
import { createDemoState, DEMO_DEFAULTS, DEMO_RESPONSES } from '../lib/demoWedding'
import styles from './DashboardShowcase.module.css'

const PROJECT = createDemoState(DEMO_DEFAULTS).project
const MENU = { meat: 'Mäsové', vegetarian: 'Vegetariánske', vegan: 'Vegánske' }
const HOTELS = [
  { name: 'Hotel Park', address: 'Nábrežie Ivana Krasku 2, Piešťany', checkIn: '18. 9. 2027 od 14:00', checkOut: '19. 9. 2027 do 10:00', guestNote: 'Raňajky sú zahrnuté v cene pobytu.' },
  { name: 'Penzión Magnolia', address: 'Nálepkova 1, Piešťany', checkIn: '18. 9. 2027 od 15:00', checkOut: '19. 9. 2027 do 11:00', guestNote: 'Parkovanie je bezplatné vo dvore penziónu.' },
]
const EXAMPLES = [
  ['rsvp', '01', 'Hosť potvrdí účasť', 'Odpovie za pár chvíľ. Vy nič neprepisujete.'],
  ['overview', '02', 'Vy máte prehľad', 'Každá odpoveď automaticky na svojom mieste.'],
  ['accommodation', '03', 'Ubytovanie bez vypisovania', 'Priraďte izbu. Pripravený e-mail pošlete z YesDay.'],
]

export default function DashboardShowcase() {
  const [view, setView] = useState('rsvp')
  const [responses, setResponses] = useState(DEMO_RESPONSES)
  const [menu, setMenu] = useState('meat')
  const [needsRoom, setNeedsRoom] = useState(true)
  const [notice, setNotice] = useState('')
  const [hotel, setHotel] = useState('0')
  const [room, setRoom] = useState('204')
  const [draft, setDraft] = useState(null)
  const [full, setFull] = useState(false)
  const attending = responses.filter(row => row.attending === 'yes')
  const total = attending.reduce((sum, row) => sum + row.adults_count + row.children_count, 0)
  const children = attending.reduce((sum, row) => sum + row.children_count, 0)
  const rooms = attending.filter(row => row.needs_accommodation).length
  const latest = responses.find(row => row.id === 'marketing-example')

  function respond(event) {
    event.preventDefault()
    const response = { id: 'marketing-example', guest_name: 'Anna a Michal', attending: 'yes', adults_count: 2, children_count: 0, needs_accommodation: needsRoom, contact_email: 'anna@example.com', people: [{ name: 'Anna', type: 'adult', menu, allergies: '' }, { name: 'Michal', type: 'adult', menu: 'meat', allergies: '' }] }
    setResponses(current => [response, ...current.filter(row => row.id !== response.id)])
    setNotice('Odpoveď Anny a Michala je v prehľade. Počty aj výber jedla sa aktualizovali.')
    setView('overview')
    setFull(false)
  }
  function prepareEmail(event) {
    event.preventDefault()
    const accommodation = HOTELS[Number(hotel)]
    const guest = { ...DEMO_RESPONSES[1], roomNumber: room.trim() }
    setDraft(buildAccommodationEmailDraft(guest, PROJECT, accommodation))
    setResponses(current => current.map(row => row.id === guest.id ? { ...row, accommodation_hotel: accommodation.name, accommodation_room: room.trim(), accommodation_hotel_address: accommodation.address, accommodation_check_in: accommodation.checkIn, accommodation_check_out: accommodation.checkOut, accommodation_guest_note: accommodation.guestNote } : row))
  }
  function chooseView(value) { setView(value); setFull(false); setNotice('') }

  function Summary() {
    return <div className={styles.summary} aria-label="Aktuálny prehľad skúšobnej svadby">
      <div><strong>{total}</strong><span>potvrdených hostí</span></div>
      <div><strong>{children}</strong><span>dieťa</span></div>
      <div><strong>{rooms}</strong><span>žiadosti o ubytovanie</span></div>
    </div>
  }
  return <section id="prehlad-pre-nevestu" className={styles.section} aria-labelledby="bride-view-title">
    <p className={styles.eyebrow}>Vyskúšajte svojho digitálneho pomocníka</p>
    <h2 id="bride-view-title" className={styles.title}>Krásny zážitok pre hostí.<br />Menej starostí pre vás.</h2>
    <p className={styles.intro}>Svadobný web, pozvánky, potvrdenia účasti aj organizácia hostí. Všetko krásne zladené a na jednom mieste.</p>
    <div className={styles.choices} aria-label="Vyberte si krátku ukážku">
      {EXAMPLES.map(([key, number, title, copy]) => <button key={key} type="button" aria-pressed={view === key} onClick={() => chooseView(key)} className={view === key ? styles.activeChoice : ''}><span>{number}</span><strong>{title}</strong><small>{copy}</small></button>)}
    </div>
    <div className={styles.browser}>
      <div className={styles.browserBar}><span className={styles.dots} aria-hidden="true">● ● ●</span><p>Skúšobná svadba · Diana a Anton</p></div>
      <p className={styles.demoNote}>Interaktívna ukážka bez registrácie. Pracujete len so vzorovými údajmi; žiadny e-mail sa neodošle.</p>
      {view === 'rsvp' && <div className={styles.twoColumns}>
        <form className={styles.guestForm} onSubmit={respond}>
          <p className={styles.label}>Takto odpovedá hosť</p><h3>Anna a Michal prídu na svadbu</h3>
          <p>Vyberte Anne jedlo a odošlite skúšobnú odpoveď.</p>
          <label>Annino menu<select value={menu} onChange={event => setMenu(event.target.value)}>{Object.entries(MENU).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className={styles.check}><input type="checkbox" checked={needsRoom} onChange={event => setNeedsRoom(event.target.checked)} /> Potrebujeme ubytovanie <small>Signature / Atelier</small></label>
          <button type="submit" className={styles.primary}>{latest ? 'Upraviť skúšobnú odpoveď' : 'Potvrdiť skúšobnú účasť'} <span aria-hidden="true">→</span></button>
        </form>
        <div className={styles.result}><p className={styles.label}>A toto uvidíte vy</p><h3>Odpovede pribúdajú. Prehľad zostáva.</h3><Summary /><p className={styles.quiet}>Po odoslaní sa sem zaradia aj Anna a Michal. Bez kopírovania mien a jedál do tabuľky.</p></div>
      </div>}
      {view === 'overview' && <div className={styles.overview}>
        <p className={styles.label}>Vaša klientska zóna</p><h3>Viete, kto príde a čo potrebuje.</h3>
        <p role="status" className={styles.success}>{notice || 'Tu vidíte aktuálne odpovede zo skúšobnej svadby.'}</p>
        <Summary />
        <div className={styles.responseList}>{responses.filter(row => row.attending === 'yes').slice(0, 3).map(row => <article key={row.id}><span className={styles.checkmark} aria-hidden="true">✓</span><div><strong>{row.guest_name}</strong><p>{row.adults_count} {row.adults_count === 1 ? 'dospelý' : 'dospelí'}{row.children_count ? ` · ${row.children_count} dieťa` : ''} · {row.people.map(person => MENU[person.menu] || 'Detské').join(', ')}</p></div><span className={styles.status}>{row.needs_accommodation ? 'Chcú ubytovanie' : 'Účasť potvrdená'}</span></article>)}</div>
        {!latest && <button type="button" className={styles.textButton} onClick={() => chooseView('rsvp')}>Skúsiť pridať odpoveď hosťa →</button>}
      </div>}
      {view === 'accommodation' && <div className={styles.twoColumns}>
        <form className={styles.guestForm} onSubmit={prepareEmail}>
          <p className={styles.label}>Signature a Atelier</p><h3>Lucia potrebuje ubytovanie.</h3><p>Vyberte hotel a izbu. YesDay z údajov pripraví správu pre hosťa.</p>
          <label>Hotel<select value={hotel} onChange={event => { setHotel(event.target.value); setDraft(null) }}>{HOTELS.map((item, index) => <option key={item.name} value={index}>{item.name}</option>)}</select></label>
          <label>Číslo izby<input value={room} maxLength={20} required onChange={event => { setRoom(event.target.value); setDraft(null) }} /></label>
          <button className={styles.primary} type="submit">Priradiť izbu a pripraviť e-mail →</button>
        </form>
        <div className={styles.result}><p className={styles.label}>Správa pre hosťa</p>{draft ? <><h3>{draft.subject}</h3><p className={styles.emailMeta}>Pre: lucia@example.com · iba náhľad</p><pre className={styles.email}>{draft.body}</pre><p className={styles.quiet}>V klientskom účte správu skontrolujete a odošlete. Táto ukážka nič neposiela.</p></> : <><h3>Adresa, izba aj čas príchodu. Bez vypisovania odznova.</h3><p className={styles.quiet}>Pripravte správu a pozrite sa, aké informácie hosť dostane. Text potom môžete upraviť.</p></>}</div>
      </div>}
      {view !== 'rsvp' && <div className={styles.more}><button type="button" aria-expanded={full} onClick={() => setFull(value => !value)} className={styles.textButton}>{full ? 'Skryť podrobnú ukážku' : 'Otvoriť celý klientsky prehľad'} {full ? '−' : '+'}</button>
        {full && <div className={styles.viewport}>{view === 'accommodation' ? <ClientAccommodation key={`${hotel}-${room}-${draft?.subject || ''}`} demoProject={PROJECT} demoResponses={responses} onDemoResponseUpdate={(id, patch) => setResponses(current => current.map(row => row.id === id ? { ...row, ...patch } : row))} /> : <ClientDashboard demoProject={PROJECT} demoResponses={responses} />}</div>}
      </div>}
    </div>
    <p className={styles.packageNote}>Potvrdenia účasti a prehľad hostí sú v každom balíku. Ubytovanie a doprava v Signature a Atelier.</p>
    <Link className={styles.textLink} href="/ukazka?tab=dashboard">Vyskúšať celú klientsku zónu bez registrácie →</Link>
  </section>
}
