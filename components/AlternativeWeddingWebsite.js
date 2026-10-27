import { getDesignCustomization } from '../lib/designCustomization'
import { buildGoogleCalendarUrl } from '../lib/googleCalendar'
import { buildGoogleMapsSearchUrl } from '../lib/googleMaps'
import { getVisibleMenuSections } from '../lib/menuSections.mjs'

const THEMES = {
  botanique: {
    label: 'Botanique',
    hero: '/templates/botanique/hero.jpg',
    story: '/templates/botanique/story-v2.jpg',
  },
  penelope: {
    label: 'Penelope',
    hero: '/templates/penelope/hero-v2.jpg',
    story: '/templates/penelope/story-v2.jpg',
  },
}

export default function AlternativeWeddingWebsite({
  variant,
  project,
  websiteContent = {},
  scheduleItems = [],
  scheduleError = null,
  rsvpHref,
  invitationRecipient = null,
}) {
  const theme = THEMES[variant] || THEMES.botanique
  const customization = getDesignCustomization(variant, project)
  const [firstPartner, secondPartner] = splitCoupleName(project.couple_display_name)
  const date = formatWeddingDate(project.wedding_date)
  const ceremonyTime = formatTime(project.ceremony_time || scheduleItems[0]?.item_time)
  const receptionTime = formatTime(project.reception_time)
  const googleCalendarUrl = buildGoogleCalendarUrl(project)
  const ceremonyMapUrl = buildGoogleMapsSearchUrl(project.venue_name, project.venue_address)
  const receptionMapUrl = buildGoogleMapsSearchUrl(
    project.reception_venue_name || project.venue_name,
    project.reception_venue_address || project.venue_address,
  )
  const palette = websiteContent.dresscode_palette_enabled === true
    ? websiteContent.dresscode_palette || []
    : []
  const visibleMenuSections = getVisibleMenuSections(websiteContent)

  return (
    <main
      className={`signatureWedding signatureWedding--${variant} signatureWedding--font-${customization.font.value}`}
      style={{ '--signature-serif': customization.font.family, '--signature-ink': customization.color.hex }}
    >
      <header className="signatureWedding__nav">
        <a href="#top" className="signatureWedding__brand">{firstPartner} {secondPartner ? `& ${secondPartner}` : ''}</a>
        <nav aria-label={`${theme.label} wedding navigation`}>
          <a href="#pribeh">Príbeh</a>
          <a href="#program">Program</a>
          <a href={rsvpHref}>RSVP</a>
        </nav>
      </header>

      <section id="top" className="signatureWedding__hero" style={{ '--signature-hero': `url("${theme.hero}")` }}>
        <div className="signatureWedding__heroShade" />
        <div className="signatureWedding__heroCopy">
          <h1>
            <span>{firstPartner}</span>
            {secondPartner ? <><i>&amp;</i><span>{secondPartner}</span></> : null}
          </h1>
          <strong>{date}</strong>
        </div>
      </section>

      {invitationRecipient ? (
        <section style={personalizedWelcomeStyle} aria-label="Personalizovaná pozvánka">
          <p style={personalizedWelcomeEyebrowStyle}>Táto pozvánka je pripravená pre</p>
          <p style={{ ...personalizedWelcomeNameStyle, color: customization.color.hex }}>{invitationRecipient.recipient_label}</p>
        </section>
      ) : null}

      <section className="signatureWedding__welcome signatureWedding__section">
        <p className="signatureWedding__eyebrow">Save the date</p>
        <h2>{websiteContent.welcome_text || 'Tešíme sa, že náš deň oslávite s nami.'}</h2>
        <div className="signatureWedding__ornament" aria-hidden="true">✦</div>
      </section>

      <section className="signatureWedding__places signatureWedding__section">
        <article>
          <p className="signatureWedding__eyebrow">Obrad</p>
          <strong>{ceremonyTime}</strong>
          <h2>{project.venue_name || 'Miesto obradu'}</h2>
          <p>{project.venue_address}</p>
          {ceremonyMapUrl ? <a className="signatureWedding__mapAction" href={ceremonyMapUrl} target="_blank" rel="noopener noreferrer">Otvoriť mapu obradu</a> : null}
        </article>
        <article>
          <p className="signatureWedding__eyebrow">Oslava</p>
          <strong>{receptionTime}</strong>
          <h2>{project.reception_venue_name || project.venue_name || 'Miesto oslavy'}</h2>
          <p>{project.reception_venue_address || project.venue_address}</p>
          {receptionMapUrl ? <a className="signatureWedding__mapAction" href={receptionMapUrl} target="_blank" rel="noopener noreferrer">Otvoriť mapu oslavy</a> : null}
        </article>
      </section>

      {websiteContent.story_text ? (
        <section id="pribeh" className="signatureWedding__story signatureWedding__section">
          <div className="signatureWedding__storyImage" style={{ '--signature-hero': `url("${theme.story}")` }} />
          <div>
            <p className="signatureWedding__eyebrow">O nás</p>
            <h2>Náš príbeh</h2>
            <p>{websiteContent.story_text}</p>
          </div>
        </section>
      ) : null}

      <section id="program" className="signatureWedding__schedule signatureWedding__section">
        <p className="signatureWedding__eyebrow">Svadobný deň</p>
        <h2>Program</h2>
        {scheduleError ? <p>Program sa momentálne nepodarilo načítať.</p> : (
          <div className="signatureWedding__timeline">
            {scheduleItems.map((item, index) => (
              <article key={item.id || `${variant}-schedule-${index}`}>
                <time>{formatTime(item.item_time ?? item.time)}</time>
                <div>
                  <h3>{item.item_title ?? item.title ?? 'Program'}</h3>
                  {(item.item_description ?? item.description) ? <p>{item.item_description ?? item.description}</p> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {visibleMenuSections.length ? <section className="signatureWedding__menu signatureWedding__section">
        <div>
          <p className="signatureWedding__eyebrow">Pri spoločnom stole</p>
          <h2>Slávnostné menu</h2>
        </div>
        <div className="signatureWedding__menuCopy">
          {visibleMenuSections.map((item) => (
            <div key={item.key} className="signatureWedding__menuCourse">
              <p>{item.label}</p>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section> : null}

      <section className="signatureWedding__details signatureWedding__section">
        <article>
          <p className="signatureWedding__eyebrow">Dress code</p>
          <h2>V tónoch nášho dňa</h2>
          <p>{websiteContent.dresscode_text || 'Elegantné spoločenské oblečenie.'}</p>
          {palette.length ? <div className="signatureWedding__palette">{palette.map((color) => <span key={color.hex} title={color.name} style={{ background: color.hex }} />)}</div> : null}
        </article>
        <article>
          <p className="signatureWedding__eyebrow">Praktické informácie</p>
          <h2>Ubytovanie</h2>
          <p>{websiteContent.accommodation_text || 'Informácie o ubytovaní doplníme čoskoro.'}</p>
          <h2>Doprava</h2>
          <p>{websiteContent.transport_text || 'Informácie o doprave a parkovaní doplníme čoskoro.'}</p>
        </article>
      </section>

      {websiteContent.faq_text ? (
        <section className="signatureWedding__faq signatureWedding__section">
          <p className="signatureWedding__eyebrow">Dobré vedieť</p>
          <h2>Otázky hostí</h2>
          {parseParagraphs(websiteContent.faq_text).map((paragraph, index) => <p key={`${variant}-faq-${index}`}>{paragraph}</p>)}
        </section>
      ) : null}

      <section className="signatureWedding__rsvp signatureWedding__section">
        <p className="signatureWedding__eyebrow">Budete pri tom?</p>
        <h2>Tešíme sa na vás</h2>
        <p>Prosíme, potvrďte nám svoju účasť a doplňte všetko, čo pre vás môžeme pripraviť.</p>
        <div className="signatureWedding__rsvpActions">
          <a href={rsvpHref}>Potvrdiť účasť</a>
          <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer" className="signatureWedding__calendarAction">Uložiť do kalendára</a>
        </div>
      </section>
    </main>
  )
}

const personalizedWelcomeStyle = { padding: '30px 24px 8px', textAlign: 'center', background: '#fffaf6' }
const personalizedWelcomeEyebrowStyle = { margin: 0, fontFamily: 'Inter,Arial,sans-serif', fontSize: '10px', letterSpacing: '.22em', textTransform: 'uppercase', opacity: .58 }
const personalizedWelcomeNameStyle = { margin: '8px 0 0', fontSize: 'clamp(24px,4vw,38px)', fontWeight: 400 }

function splitCoupleName(value) {
  const parts = String(value || 'Naša svadba').split(/\s*(?:&|\+|\/|\ba\b)\s*/i).filter(Boolean)
  return parts.length > 1 ? [parts[0], parts.slice(1).join(' ')] : [parts[0], '']
}

function formatWeddingDate(value) {
  if (!value) return 'Dátum doplníme'
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function formatTime(value) {
  if (!value) return '—'
  return String(value).slice(0, 5)
}

function parseParagraphs(value) {
  const text = String(value || 'Informácie doplníme čoskoro.').trim()
  return text.split(/\n+/).map((part) => part.trim()).filter(Boolean)
}
