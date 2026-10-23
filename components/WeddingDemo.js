'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import DianaStationerySet from './DianaStationerySet'
import AlternativeStationerySet from './AlternativeStationerySet'
import ClientDashboard from './ClientDashboard'
import ClientEditor from './ClientEditor'
import ClientAccommodation from './ClientAccommodation'
import DemoRsvp from './DemoRsvp'
import { DEMO_FIELDS, DEMO_DEFAULTS, DEMO_RESPONSES, normalizeDemo, createDemoState, readDemoState } from '../lib/demoWedding'
import { DESIGN_CUSTOMIZATION_OPTIONS } from '../lib/designCustomization'
import styles from './WeddingDemo.module.css'

const subscribeOrigin = () => () => {}
const readOrigin = () => window.location.origin
const serverOrigin = () => ''

const TABS = [['web', 'Svadobný web'], ['editor', 'Editor'], ['dashboard', 'Hostia'], ['accommodation', 'Ubytovanie'], ['stationery', 'Pozvánka + QR'], ['rsvp', 'Vyskúšať RSVP']]
const DESIGNS = [['diana', 'Diana'], ['botanique', 'Botanique'], ['penelope', 'Penelope']]

export default function WeddingDemo({ initialValues }) {
  const [values, setValues] = useState(() => normalizeDemo(initialValues))
  const [tab, setTab] = useState(TABS.some(([key]) => key === initialValues?.tab) ? initialValues.tab : 'web')
  const [demoData, setDemoData] = useState(() => readDemoState(initialValues))
  const [previewQuery, setPreviewQuery] = useState(() => new URLSearchParams({ details: JSON.stringify(readDemoState(initialValues)) }).toString())
  const origin = useSyncExternalStore(subscribeOrigin, readOrigin, serverOrigin)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrError, setQrError] = useState('')
  const [responses, setResponses] = useState(DEMO_RESPONSES)
  const [notice, setNotice] = useState('')
  const project = demoData.project
  const designName = DESIGNS.find(([key]) => key === project.design_family)?.[1] || 'Diana'
  const designOptions = DESIGN_CUSTOMIZATION_OPTIONS[project.design_family]
  const [websiteUrl, setWebsiteUrl] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setPreviewQuery(new URLSearchParams({ details: JSON.stringify(demoData) }).toString()), 450)
    return () => clearTimeout(timer)
  }, [demoData])
  useEffect(() => {
    if (!origin) return
    let active = true
    async function generateQr() {
      const compressed = new Blob([JSON.stringify(demoData)]).stream().pipeThrough(new CompressionStream('deflate'))
      const bytes = new Uint8Array(await new Response(compressed).arrayBuffer())
      const packed = btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
      const link = `${origin}/ukazka/web?packed=${packed}`
      const url = await QRCode.toDataURL(link, { width: 320, margin: 2 })
      if (active) { setWebsiteUrl(link); setQrDataUrl(url); setQrError('') }
    }
    generateQr().catch(() => { if (active) { setWebsiteUrl(''); setQrDataUrl(''); setQrError('QR kód sa nepodarilo vytvoriť. Skúste skrátiť texty ukážky.') } })
    return () => { active = false }
  }, [origin, demoData])

  function reset() {
    const defaults = { ...DEMO_DEFAULTS, design: project.design_family, font: project.design_font_variant, ink: project.design_text_color }; setValues(defaults); setDemoData(createDemoState(defaults)); setResponses(DEMO_RESPONSES); setNotice('Ukážka bola obnovená.'); setTab('web')
  }
  function changeDesign(design) {
    setValues(current => ({ ...current, design, font: 'serif', ink: 'primary' }))
    setDemoData(current => ({ ...current, project: { ...current.project, design_family: design, design_font_variant: 'serif', design_text_color: 'primary' } }))
    setNotice(`Dizajn bol zmenený na ${DESIGNS.find(([key]) => key === design)?.[1]}.`)
    setTab('web')
  }
  function changeCustomization(field, value) {
    setDemoData(current => ({ ...current, project: { ...current.project, [field]: value } }))
    setValues(current => ({ ...current, [field === 'design_font_variant' ? 'font' : 'ink']: value }))
    setNotice('Písmo a farba sa premietli do webu, pozvánky aj QR kartičky.')
  }
  function changeQuickField(key, value) {
    const next = { ...values, [key]: value }
    setValues(next)
    const quick = createDemoState(next)
    const projectKeys = { first: 'couple_display_name', second: 'couple_display_name', date: 'wedding_date', time: 'ceremony_time', venue: 'venue_name', city: 'venue_address', reception: 'reception_venue_name' }
    setDemoData(current => key === 'welcome' ? { ...current, content: { ...current.content, welcome_text: value } } : { ...current, project: { ...current.project, [projectKeys[key]]: quick.project[projectKeys[key]] } })
  }
  function saveDemo(data) {
    setDemoData(data)
    const names = String(data.project.couple_display_name).split(/\s+(?:a|&|\+)\s+/i)
    setValues({ first: names[0] || '', second: names.slice(1).join(' a '), date: data.project.wedding_date || '', time: String(data.project.ceremony_time || '').slice(0, 5), venue: data.project.venue_name, city: data.project.venue_address, reception: data.project.reception_venue_name, welcome: data.content.welcome_text })
    setNotice('Údaje z editora sa premietli do svadobného webu a tlačovín.')
  }
  function submitRsvp(response) {
    setResponses(current => [response, ...current])
    setNotice('Odpoveď bola pridaná. V záložke Hostia si môžete rozkliknúť dospelých, deti, alergie, ubytovanie alebo dopravu.')
    setTab('dashboard')
  }
  function updateDemoResponse(id, patch) {
    setResponses(current => current.map(row => row.id === id ? { ...row, ...patch } : row))
  }

  return <main className={styles.page}>
    <header className={styles.header}><Link href="/">YES DAY <span>STUDIO</span></Link><Link href="/#portfolio">Späť na šablóny</Link></header>
    <section className={styles.intro}>
      <p className={styles.eyebrow}>{designName} · interaktívna ukážka</p>
      <h1>Váš deň. Váš príbeh. Jeden krásny celok.</h1>
      <p>Skúste si zadať svoje mená a detaily svadby. Web, pozvánka aj QR kartička sa prispôsobia vám.</p>
      <p className={styles.note}>Bez registrácie. Údaje sa neukladajú do klientskych projektov. Obnovením stránky sa vaše úpravy vymažú. QR kód otvorí ukážkový web s vyplnenými údajmi.</p>
    </section>
    <div className={styles.layout}>
      <aside className={styles.editor}>
        <h2>Predstavte si svoju svadbu</h2>
        <div className={styles.designPicker}>
          <span>Vyberte si dizajn</span>
          <div>{DESIGNS.map(([key, label]) => <button type="button" key={key} aria-pressed={project.design_family === key} className={project.design_family === key ? styles.designActive : ''} onClick={() => changeDesign(key)}>{label}</button>)}</div>
        </div>
        {designOptions ? <div className={styles.customizationPicker}>
          <label>Písmo
            <select value={project.design_font_variant || 'serif'} onChange={event => changeCustomization('design_font_variant', event.target.value)}>
              {designOptions.fonts.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <span>Farba písma</span>
          <div className={styles.inkChoices}>
            {designOptions.colors.map(option => <button type="button" key={option.value} aria-label={option.label} title={option.label} aria-pressed={(project.design_text_color || 'primary') === option.value} className={(project.design_text_color || 'primary') === option.value ? styles.inkActive : ''} style={{ '--ink-choice': option.hex }} onClick={() => changeCustomization('design_text_color', option.value)}><span style={{ background: option.hex }} />{option.label}</button>)}
          </div>
        </div> : null}
        {DEMO_FIELDS.map(([key, label, type]) => <label key={key}>{label}<input type={type} value={values[key]} maxLength={key === 'welcome' ? 240 : 80} onChange={event => changeQuickField(key, event.target.value)} /></label>)}
        <button type="button" className={styles.secondary} onClick={reset}>Obnoviť vzorové údaje</button>
      </aside>
      <section className={styles.preview} aria-label="Ukážka vašej svadby">
        <div className={styles.tabs} aria-label="Vyberte náhľad">{TABS.map(([key, label]) => <button type="button" key={key} aria-pressed={tab === key} className={tab === key ? styles.active : ''} onClick={() => setTab(key)}>{label}</button>)}</div>
        <div className={styles.packagePrompt}>
          <div>
            <p>Chcete vlastný YesDay?</p>
            <strong>Vyberte si svadobný balík a vytvorte si svoj priestor pre hostí.</strong>
          </div>
          <Link href={`/?design=${project.design_family}#cennik`} target="_blank" rel="noopener noreferrer">Vybrať svadobný balík</Link>
        </div>
        {tab === 'web' && <>
          <div className={styles.webPreviewHeader}>
            <p className={styles.hint}>Skutočný dizajn {designName} s vašimi údajmi. Posuňte sa v náhľade a prezrite si celý web.</p>
            {websiteUrl ? <a className={styles.guestViewLink} href={websiteUrl} target="_blank" rel="noopener noreferrer">Otvoriť web pre hostí</a> : null}
          </div>
          <iframe title={`Živá ukážka svadobného webu ${designName}`} className={styles.frame} src={`/ukazka/web?${previewQuery}`} />
        </>}
        {tab === 'stationery' && <div className={styles.stationery}>{project.design_family === 'diana' ? <DianaStationerySet project={project} weddingWebsiteUrl={websiteUrl} websiteDisplayUrl={origin ? `${origin}/ukazka/web` : "Ukážka svadobného webu"} qrDataUrl={qrDataUrl} qrError={qrError} /> : <AlternativeStationerySet variant={project.design_family} project={project} weddingWebsiteUrl={websiteUrl} websiteDisplayUrl={origin ? `${origin}/ukazka/web` : "Ukážka svadobného webu"} qrDataUrl={qrDataUrl} qrError={qrError} />}</div>}
        {tab === 'editor' && <div className={styles.dashboard}><ClientEditor demoData={demoData} onDemoSave={saveDemo} /></div>}
        {tab === 'dashboard' && <div className={styles.dashboard}>
          <p className={styles.hint}>Prehľad hostí z klientskej zóny: dospelí, deti, alergie, požiadavky na ubytovanie a dopravu. Kliknutím na jednotlivé prehľady zobrazíte mená a detaily.</p>
          <ClientDashboard demoProject={project} demoResponses={responses} />
        </div>}
        {tab === 'accommodation' && <div className={styles.dashboard}><p className={styles.hint}>Vyskúšajte priradiť hotel a izbu. Jedným klikom potom odošlete hosťovi e-mail s adresou, check-inom, check-outom aj číslom izby. Zmeny sa uchovajú pri prepínaní záložiek.</p><ClientAccommodation demoProject={project} demoResponses={responses} onDemoResponseUpdate={updateDemoResponse} /></div>}
        {tab === 'rsvp' && <div className={styles.rsvp}><DemoRsvp onSubmit={submitRsvp} /></div>}
        <p role="status" className={styles.hint}>{notice}</p>
      </section>
    </div>
    <section className={styles.cta}><h2>Páči sa vám vaša svadba v štýle {designName}?</h2><Link href={`/?design=${project.design_family}#cennik`} target="_blank" rel="noopener noreferrer">Pozrieť balíky</Link></section>
  </main>
}
