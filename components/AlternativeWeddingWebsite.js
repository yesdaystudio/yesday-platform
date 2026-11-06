import ChloeDecorations from './ChloeDecorations'
import WeddingGallery from './WeddingGallery'
import { getDesignCustomization, getWeddingHeroFonts } from '../lib/designCustomization'
import { buildGoogleCalendarUrl } from '../lib/googleCalendar'
import { buildGoogleMapsSearchUrl } from '../lib/googleMaps'
import { getVisibleMenuSections } from '../lib/menuSections.mjs'

const THEMES = {
  riviera: { label: 'Riviera', hero: '/templates/riviera/sea-oil-painting.webp', story: null },
  veno: { label: 'Veno', hero: null, story: null },
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
  chloe: {
    label: 'Chloe',
    hero: null,
    story: null,
  },
  fleurie: {
    label: 'Fleurie',
    hero: null,
    story: null,
  },
  provence: {
    label: 'Provence',
    hero: '/templates/provence/hero-lavender-garden.jpg',
    story: '/templates/provence/story-wedding-attire.jpg',
  },
  lavande: {
    label: 'Lavande',
    hero: null,
    story: null,
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
  gallery = null,
}) {
  const theme = THEMES[variant] || THEMES.botanique
  const customization = getDesignCustomization(variant, project)
  const heroFonts = getWeddingHeroFonts(variant, project)
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
        {variant === 'botanique' ? (
          <>
            <nav className="botaniqueHeroNav" aria-label={`${theme.label} wedding navigation`}>
              <a href="#pribeh">Náš príbeh</a>
              <a href="#detaily">Detaily</a>
              <a href={rsvpHref}>RSVP</a>
              <a className="botaniqueHeroNav__rsvp" href={rsvpHref}>Potvrdiť účasť</a>
            </nav>
            <details className="botaniqueHeroMobileNav">
              <summary aria-label="Otvoriť menu"><span /><span /><span /></summary>
              <nav aria-label={`${theme.label} mobile wedding navigation`}>
                <a href="#pribeh">Náš príbeh</a>
                <a href="#detaily">Detaily</a>
                <a href={rsvpHref}>Potvrdiť účasť</a>
              </nav>
            </details>
          </>
        ) : variant === 'penelope' ? (
          <>
            <nav className="penelopeHeroNav" aria-label={`${theme.label} wedding navigation`}>
              <a href="#pribeh">Náš príbeh</a>
              <a href="#detaily">Detaily</a>
              <a href="#program">Program</a>
              <a className="penelopeHeroNav__rsvp" href={rsvpHref}>Potvrdiť účasť</a>
            </nav>
            <details className="penelopeHeroMobileNav">
              <summary aria-label="Otvoriť menu"><span /><span /><span /></summary>
              <nav aria-label={`${theme.label} mobile wedding navigation`}>
                <a href="#pribeh">Náš príbeh</a>
                <a href="#detaily">Detaily</a>
                <a href="#program">Program</a>
                <a href={rsvpHref}>Potvrdiť účasť</a>
              </nav>
            </details>
          </>
        ) : variant === 'provence' ? (
          <>
            <nav className="provenceHeroNav" aria-label={`${theme.label} wedding navigation`}>
              <a href="#pribeh">Náš príbeh</a>
              <a href="#detaily">Miesta</a>
              <a href="#program">Program</a>
              <a className="provenceHeroNav__rsvp" href={rsvpHref}>Potvrdiť účasť</a>
            </nav>
            <details className="provenceHeroMobileNav">
              <summary aria-label="Otvoriť menu"><span /><span /><span /></summary>
              <nav aria-label={`${theme.label} mobile wedding navigation`}>
                <a href="#pribeh">Náš príbeh</a>
                <a href="#detaily">Miesta</a>
                <a href="#program">Program</a>
                <a href={rsvpHref}>Potvrdiť účasť</a>
              </nav>
            </details>
          </>
        ) : variant === 'riviera' ? (
          <>
            <nav className="rivieraHeroNav" aria-label="Svadobná navigácia">
              <a href="#pribeh">Náš príbeh</a><a href="#detaily">Miesta</a><a href="#program">Program</a><a className="rivieraHeroNav__rsvp" href={rsvpHref}>Potvrdiť účasť</a>
            </nav>
            <details className="rivieraMobileNav">
              <summary aria-label="Otvoriť menu"><span /><span /><span /></summary>
              <nav aria-label="Mobilná svadobná navigácia"><a href="#pribeh">Náš príbeh</a><a href="#detaily">Miesta</a><a href="#program">Program</a><a href={rsvpHref}>Potvrdiť účasť</a></nav>
            </details>
          </>
        ) : variant === 'lavande' || variant === 'veno' ? (
          <>
            <nav className="lavandeHeroNav" aria-label={`${theme.label} wedding navigation`}>
              <a href="#pribeh">Náš príbeh</a>
              <a href="#detaily">Miesta</a>
              <a href="#program">Program</a>
              <a className="lavandeHeroNav__rsvp" href={rsvpHref}>Potvrdiť účasť</a>
            </nav>
            <details className="lavandeHeroMobileNav">
              <summary aria-label="Otvoriť menu"><span /><span /><span /></summary>
              <nav aria-label={`${theme.label} mobile wedding navigation`}>
                <a href="#pribeh">Náš príbeh</a>
                <a href="#detaily">Miesta</a>
                <a href="#program">Program</a>
                <a href={rsvpHref}>Potvrdiť účasť</a>
              </nav>
            </details>
          </>
        ) : (
          <nav aria-label={`${theme.label} wedding navigation`}>
            <a href="#pribeh">Príbeh</a>
            <a href="#program">Program</a>
            <a href={rsvpHref}>RSVP</a>
          </nav>
        )}
      </header>

      <section id="top" className="signatureWedding__hero" style={{ '--signature-hero': theme.hero ? `url("${theme.hero}")` : 'none' }}>
        <div className="signatureWedding__heroShade" />
        {variant === 'botanique' ? <BotaniqueHeroDecorations /> : null}
        {variant === 'penelope' ? <PenelopeHeroDecorations /> : null}
        {variant === 'chloe' ? <ChloeDecorations /> : null}
        {variant === 'fleurie' ? <FleurieHeroDecorations /> : null}
        {variant === 'provence' ? <ProvenceHeroDecorations /> : null}
        {variant === 'lavande' ? <LavandeHeroDecorations /> : null}
        {variant === 'veno' ? <div className="venoHeroArt" aria-hidden="true"><span className="venoHeroArt__lace" /><span className="venoHeroArt__embroidery" /><span className="venoHeroArt__seam" /></div> : null}
        <div className="signatureWedding__heroCopy">
          {variant === 'botanique' || variant === 'fleurie' ? <p>Budeme sa brať</p> : null}
          {variant === 'penelope' || variant === 'veno' ? <p>S radosťou vás pozývame</p> : null}
          {variant === 'provence' ? <p>Náš svadobný deň</p> : null}
          {variant === 'lavande' ? <p>Sous le ciel de Provence</p> : null}
          {variant === 'riviera' ? <p>S vami má leto krajší príbeh</p> : null}
          <h1 style={{ fontFamily: heroFonts.names }}>
            <span>{firstPartner}</span>
            {secondPartner ? <><i style={{ fontFamily: heroFonts.joiner, fontStyle: heroFonts.joinerStyle }}>&amp;</i><span>{secondPartner}</span></> : null}
          </h1>
          <strong>{date}</strong>
          {variant === 'botanique' ? (
            <>
              <span className="signatureWedding__heroSprig" aria-hidden="true" />
              <a className="signatureWedding__heroAction" href={websiteContent.story_text ? '#pribeh' : '#detaily'}>
                Viac o našej svadbe
              </a>
            </>
          ) : variant === 'penelope' ? (
            <>
              <span className="penelopeHeroFlourish" aria-hidden="true" />
              <a className="signatureWedding__heroAction" href={websiteContent.story_text ? '#pribeh' : '#detaily'}>
                Objaviť náš deň
              </a>
            </>
          ) : variant === 'fleurie' ? (
            <>
              <span className="fleurieHeroFlourish" aria-hidden="true" />
              <a className="signatureWedding__heroAction" href={websiteContent.story_text ? '#pribeh' : '#detaily'}>
                Náš svadobný deň
              </a>
            </>
          ) : variant === 'provence' ? (
            <>
              <span className="provenceHeroFlourish" aria-hidden="true">náš príbeh</span>
              <a className="signatureWedding__heroAction" href={websiteContent.story_text ? '#pribeh' : '#detaily'}>
                Objaviť náš deň
              </a>
            </>
          ) : variant === 'riviera' ? (
            <a className="signatureWedding__heroAction" href={websiteContent.story_text ? '#pribeh' : '#detaily'}>Náš svadobný deň <span aria-hidden="true">↓</span></a>
          ) : variant === 'lavande' || variant === 'veno' ? (
            <>
              <span className="lavandeHeroFlourish" aria-hidden="true" />
              <a className="signatureWedding__heroAction" href={websiteContent.story_text ? '#pribeh' : '#detaily'}>
                Vstúpiť do nášho dňa
              </a>
            </>
          ) : null}
        </div>
        {variant === 'botanique' || variant === 'penelope' || variant === 'fleurie' || variant === 'provence' || variant === 'lavande' ? <a className="signatureWedding__heroDown" href={websiteContent.story_text ? '#pribeh' : '#program'} aria-label="Prejsť na ďalšie informácie">⌄</a> : null}
      </section>

      {invitationRecipient ? (
        <section style={personalizedWelcomeStyle} aria-label="Personalizovaná pozvánka">
          <p style={personalizedWelcomeEyebrowStyle}>S radosťou vás pozývame</p>
          <p style={{ ...personalizedWelcomeNameStyle, color: customization.color.hex }}>{invitationRecipient.recipient_label}</p>
        </section>
      ) : null}

      <section className="signatureWedding__welcome signatureWedding__section">
        <p className="signatureWedding__eyebrow">{variant === 'veno' ? 'Jeden deň. Na celý život.' : variant === 'riviera' ? 'Láska má vôňu leta' : 'Save the date'}</p>
        <h2>{websiteContent.welcome_text || 'Tešíme sa, že náš deň oslávite s nami.'}</h2>
        <div className="signatureWedding__ornament" aria-hidden="true">{variant === 'veno' || variant === 'riviera' ? null : '✦'}</div>
      </section>

      <section id="detaily" className="signatureWedding__places signatureWedding__section">
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
          {variant !== 'botanique' && variant !== 'penelope' && variant !== 'fleurie' && variant !== 'lavande' && variant !== 'veno' && variant !== 'riviera' ? <div className="signatureWedding__storyImage" style={{ '--signature-hero': `url("${theme.story}")` }} /> : null}
          <div className="signatureWedding__storyCopy">
            <p className="signatureWedding__eyebrow">O nás</p>
            {variant === 'chloe' ? <span className="chloeStoryDivider" aria-hidden="true" /> : null}
            <h2>Náš príbeh</h2>
            {variant === 'penelope' ? <span className="penelopeStoryGarland" aria-hidden="true"><i /></span> : null}
            {variant === 'fleurie' ? <span className="fleurieStoryGarland" aria-hidden="true" /> : null}
            {variant === 'lavande' ? <span className="lavandeStoryMark" aria-hidden="true" /> : null}
            <p>{websiteContent.story_text}</p>
          </div>
        </section>
      ) : null}

      {websiteContent.story_text && variant === 'botanique' ? <BotaniqueSectionDivider /> : null}
      <section id="program" className="signatureWedding__schedule signatureWedding__section">
        {variant === 'chloe' ? <ChloeDecorations edge /> : null}
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
        {variant === 'provence' ? <div className="provenceMenuPhoto" aria-hidden="true" /> : null}
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
          {variant === 'chloe' ? <div className="chloeQuestions">{parseParagraphs(websiteContent.faq_text).map((paragraph, index) => index === 0 ? <h3 key={index}>{paragraph}</h3> : <p key={index}>{paragraph}</p>)}</div> : parseParagraphs(websiteContent.faq_text).map((paragraph, index) => <p key={`${variant}-faq-${index}`}>{paragraph}</p>)}
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
      <WeddingGallery gallery={gallery} />
    </main>
  )
}

function BotaniqueHeroDecorations() {
  return (
    <div className="botaniqueHeroDecorations" aria-hidden="true">
      <span className="botaniqueHeroDecorations__wash botaniqueHeroDecorations__wash--top" />
      <span className="botaniqueHeroDecorations__wash botaniqueHeroDecorations__wash--bottom" />
      <span className="botaniqueHeroDecorations__branch botaniqueHeroDecorations__branch--top" />
      <span className="botaniqueHeroDecorations__branch botaniqueHeroDecorations__branch--bottom" />
      <i className="botaniqueHeroDecorations__petal botaniqueHeroDecorations__petal--one" />
      <i className="botaniqueHeroDecorations__petal botaniqueHeroDecorations__petal--two" />
      <i className="botaniqueHeroDecorations__petal botaniqueHeroDecorations__petal--three" />
      <i className="botaniqueHeroDecorations__petal botaniqueHeroDecorations__petal--four" />
    </div>
  )
}

function FleurieHeroDecorations() {
  return <div className="fleurieHeroMeadow" aria-hidden="true" />
}

function ProvenceHeroDecorations() {
  return (
    <div className="provenceHeroVisual" aria-hidden="true">
      <span className="provenceHeroVisual__image" />
      <span className="provenceHeroVisual__caption">Entre pierre &amp; lavande</span>
    </div>
  )
}

function LavandeHeroDecorations() {
  return (
    <div className="lavandeHeroLayers" aria-hidden="true">
      <span className="lavandeHeroLayers__wash" />
      <span className="lavandeHeroLayers__olive" />
      <span className="lavandeHeroLayers__meadow" />
    </div>
  )
}


function PenelopeHeroDecorations() {
  return (
    <div className="penelopeHeroDecorations" aria-hidden="true">
      <span className="penelopeHeroDecorations__branch penelopeHeroDecorations__branch--top" />
      <span className="penelopeHeroDecorations__branch penelopeHeroDecorations__branch--bottom" />
      <i className="penelopeHeroDecorations__petal penelopeHeroDecorations__petal--one" />
      <i className="penelopeHeroDecorations__petal penelopeHeroDecorations__petal--two" />
      <i className="penelopeHeroDecorations__petal penelopeHeroDecorations__petal--three" />
    </div>
  )
}

function BotaniqueSectionDivider() {
  return (
    <div className="botaniqueSectionDivider" aria-hidden="true">
      <span className="botaniqueSectionDivider__sprig botaniqueSectionDivider__sprig--left" />
      <i />
      <span className="botaniqueSectionDivider__sprig botaniqueSectionDivider__sprig--right" />
    </div>
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
