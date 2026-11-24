import Link from 'next/link'
import PricingSection from './components/PricingSection'
import HowItWorksVisual from '../components/HowItWorksVisual'
import DashboardShowcase from '../components/DashboardShowcase'
import HomeNavigation from '../components/HomeNavigation'
import TemplateGallery from '../components/TemplateGallery'
import styles from '../components/HomeMarketing.module.css'
import { getWeddingHeroFonts } from '../lib/designCustomization'

const serifClassName = 'font-playfair-display'
const sansClassName = 'font-montserrat'

const TEMPLATES = [
  {
    name: 'Cathedral',
    description: 'Gotické oblúky, jemné modré ornamenty a svetlo vitráží.',
    preview: '#faf7f0',
    previewImage: '/templates/cathedral/hero-architecture-v2.webp',
    previewBackgroundPosition: 'center',
    previewBackgroundSize: 'cover',
    previewCouple: ['Tamara', 'Samuel'],
    previewCoupleStyle: 'cathedral',
    previewDate: '18. septembra 2027',
    href: '/ukazka?design=cathedral&first=Tamara&second=Samuel&date=2027-09-18&venue=D%C3%B3m%20sv.%20Martina&city=Bratislava',
  },
  {
    name: 'Diana',
    description:
      'Nadčasová elegancia s atmosférou talianskej vily a slávnostnej svadby.',
    previewImage: '/templates/diana/diana-hero-bg.png',
    previewCouple: ['Diana', 'Anton'],
    previewCoupleStyle: 'diana',
    previewJoiner: 'a',
    href: '/ukazka',
  },
  {
    name: 'Lavande',
    description:
      'Levanduľa, olivy a vzdušná francúzska romantika.',
    preview: '#fbf8f1',
    previewImage: '/templates/lavande/hero-rear-watercolor.png',
    previewBackgroundPosition: 'center bottom',
    previewBackgroundSize: '100% auto',
    previewCouple: ['Amélia', 'Oliver'],
    previewCoupleStyle: 'lavande',
    previewEyebrow: 'Sous le ciel de Provence',
    previewDate: '21. augusta 2027',
    previewDecorations: [
      { image: '/templates/lavande/hero-foreground-lavender.png', placement: 'lavandeFront' },
    ],
    href: '/ukazka?design=lavande',
  },
  {
    name: 'Riviera',
    description: 'Maľované more a citróny pre svadbu s letnou ľahkosťou.',
    preview: '#f8f5eb',
    previewImage: '/templates/riviera/sea-oil-painting.webp',
    previewBackgroundPosition: 'center',
    previewBackgroundSize: 'cover',
    previewCouple: ['Sofia', 'Adam'],
    previewCoupleStyle: 'riviera',
    previewEyebrow: 'S vami má leto krajší príbeh',
    previewDate: '12. júna 2027',
    href: '/ukazka?design=riviera',
  },
  {
    name: 'Chloe',
    description:
      'Jemná gypsomilka a akvarel v zelenomodrých tónoch.',
    previewImage: '/templates/chloe/watercolor.png',
    previewCouple: ['Nina', 'Matej'],
    previewCoupleStyle: 'chloe',
    previewDate: '18. septembra 2027',
    previewDecorations: [
      { image: '/templates/chloe/gypsophila-left.png', placement: 'chloeLeft' },
      { image: '/templates/chloe/gypsophila-right.png', placement: 'chloeRight' },
    ],
    href: '/ukazka?design=chloe',
  },
  {
    name: 'Fleurie',
    description:
      'Lúčne kvety a teplé púdrové tóny pre romantický deň.',
    preview: '#fbf3ee',
    previewImage: '/templates/fleurie/hero-paper-texture.jpg',
    previewBackgroundPosition: 'center',
    previewBackgroundSize: 'cover',
    previewDecorations: [
      { image: '/templates/fleurie/meadow-hero.png', placement: 'fleurieMeadow' },
    ],
    previewCouple: ['Ema', 'Juraj'],
    previewCoupleStyle: 'fleurie',
    previewEyebrow: 'Budeme sa brať',
    previewDate: '14. júna 2027',
    href: '/ukazka?design=fleurie',
  },
  {
    name: 'Veno',
    description: 'Ľudová romantika s výšivkou, čipkou a jemným ľanom.',
    preview: '#f5f0e6',
    previewImage: '/templates/veno/embroidery.svg',
    previewBackgroundPosition: 'right -35px center',
    previewBackgroundSize: 'auto 110%',
    previewCouple: ['Marína', 'Matej'],
    previewCoupleStyle: 'veno',
    previewEyebrow: 'S radosťou vás pozývame',
    previewDate: '18. septembra 2027',
    href: '/ukazka?design=veno',
  },
  {
    name: 'Penelope',
    description:
      'Romantické kvety, jemný akvarel a atmosféra rozprávkovej svadby.',
    previewImage: '/templates/penelope/redesign/hero-watercolor.webp',
    previewCouple: ['Sofia', 'Samuel'],
    previewCoupleStyle: 'penelope',
    previewEyebrow: 'S radosťou vás pozývame',
    previewDate: '18. septembra 2027',
    previewDecorations: [
      { image: '/templates/penelope/redesign/sweet-pea-top.webp', placement: 'penelopeTop' },
      { image: '/templates/penelope/redesign/sweet-pea-bottom.webp', placement: 'penelopeBottom' },
    ],
    href: '/ukazka?design=penelope',
  },
  {
    name: 'Provence',
    description:
      'Levanduľová záhrada a prírodný ľan v pokojnom francúzskom štýle.',
    preview: '#f3eee4',
    previewImage: '/templates/provence/hero-lavender-garden.jpg',
    previewBackgroundPosition: '72% center',
    previewBackgroundSize: 'cover',
    previewCouple: ['Elena', 'Tomáš'],
    previewCoupleStyle: 'provence',
    previewEyebrow: 'Náš svadobný deň',
    previewDate: '6. júna 2027',
    href: '/ukazka?design=provence',
  },
  {
    name: 'Botanique',
    description:
      'Jemná zeleň a akvarelové detaily s atmosférou romantickej záhrady.',
    preview: '#ffffff',
    previewImage: '/templates/botanique/foliage-top-clean-v5.png',
    previewBackgroundSize: 'auto 78%',
    previewBackgroundPosition: 'left 5px top 5px',
    previewCouple: ['Laura', 'Matej'],
    previewCoupleStyle: 'botanique',
    previewEyebrow: 'Budeme sa brať',
    previewDate: '18. septembra 2027',
    previewDecorations: [
      { image: '/templates/botanique/watercolor-wash-v4.png', placement: 'botaniqueWash' },
      { image: '/templates/botanique/foliage-bottom-v3.png', placement: 'botaniqueBottom' },
    ],
    href: '/ukazka?design=botanique',
  },
]



export default function HomePage() {
  return (
    <main className={`${sansClassName} ${styles.page}`} style={pageStyle}>
      <HomeNavigation />
      <Hero />
      <HowItWorks />
      <Templates />
      <section style={systemSectionStyle} aria-label="Ukážka klientskej zóny">
        <div style={systemInnerStyle}><DashboardShowcase /></div>
      </section>
      <PricingSection />
      <PersonalPanel />
      <Questions />
      <FinalInvitation />
      <Contact />
      <Footer />
    </main>
  )
}

function HowItWorks() {
  return (
    <section id="ako-funguje" style={systemSectionStyle}>
      <div style={systemInnerStyle}>
        <p style={sectionLabelStyle}>Ako funguje YesDay</p>
        <h2 className={serifClassName} style={systemHeadingStyle}>
          Od pozvánky až po odpovede hostí
        </h2>
        <p style={systemIntroStyle}>
          Pozvánka pozve. YesDay pomáha aj potom: hosťom vysvetlí kde a kedy,
          zozbiera potvrdenia účasti a vám ukáže, kto príde a aké jedlo si vybral.
        </p>

        <HowItWorksVisual />

        <p className={serifClassName} style={systemClosingStyle}>
          Menej správ „Kde to je? O koľkej máme prísť?“
          Hosťom pošlete pozvánku s QR kartičkou. Naskenujú kód a všetky dôležité
          informácie si nájdu sami na vašom svadobnom webe.
        </p>

      </div>
    </section>
  )
}

function Hero() {
  return (
    <section className={styles.hero} style={heroStyle}>
      <div style={heroInnerStyle}>
        <div style={heroBrandStyle}>
          <p className={serifClassName} style={heroLogoStyle}>
            YES DAY
          </p>
          <p style={heroSubBrandStyle}>STUDIO</p>
        </div>

        <p style={heroEyebrowStyle}>Váš digitálny svadobný pomocník</p>

        <h1 className={serifClassName} style={heroHeadingStyle}>
          Menej správ hosťom. Viac pokoja pred svadbou.
        </h1>

        <div style={heroDividerStyle} />

        <p style={heroLeadStyle}>
          Pozvánky, potvrdenia účasti aj všetky informácie pre hostí na jednom mieste. Bez nekonečných správ a tabuliek.
        </p>

        <div className={styles.heroActions} style={heroActionsStyle}>
          <Link href="#portfolio" style={heroPrimaryButtonStyle}>
            Vybrať náš svadobný štýl ↓
          </Link>
          <Link href="/ukazka" style={heroSecondaryButtonStyle}>
            Vyskúšať YesDay zadarmo
          </Link>
        </div>
        <p className={styles.trustLine}><span>Ukážka bez registrácie a bez platby</span><span>Balíky od 129 €</span></p>
        <div className={styles.heroProof} aria-label="Čo YesDay vyrieši">
          <div><strong>Hostia majú jasno</strong><span>Miesta, program a informácie na jednom odkaze.</span></div>
          <div><strong>Vy máte odpovede</strong><span>Účasť a výber jedla bez prepisovania.</span></div>
          <div><strong>Všetko spolu ladí</strong><span>Pozvánka, web aj QR kartička vo vašom štýle.</span></div>
        </div>
      </div>
    </section>
  )
}

function Templates() {
  return (
    <section id="portfolio" style={sectionStyle}>
      <h2 className={serifClassName} style={sectionHeadingStyle}>
        Nájdite štýl vášho svadobného dňa
      </h2>
      <p style={sectionIntroStyle}>
        Desať dizajnových rodín. V každej zladený svadobný web, pozvánky a QR kartičky.
      </p>

      <TemplateGallery count={TEMPLATES.length}>
        {TEMPLATES.map((template) => (
          <article key={template.name} style={templateCardStyle}>
            <div
              style={{
                ...templatePreviewStyle,
                background: template.preview,
                ...(template.previewImage
                  ? {
                    backgroundImage: `url("${template.previewImage}")`,
                    backgroundPosition: template.previewBackgroundPosition || 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: template.previewBackgroundSize || 'cover',
                  }
                  : {}),
              }}
            >
              {template.previewDecorations?.map((decoration) => (
                <span
                  key={decoration.placement}
                  aria-hidden="true"
                  style={{
                    ...templateDecorationStyle,
                    ...templateDecorationPlacements[decoration.placement],
                    backgroundImage: `url("${decoration.image}")`,
                  }}
                />
              ))}
              {!template.previewImage ? (
                <span className={serifClassName} style={templatePreviewNameStyle}>
                  {template.name}
                </span>
              ) : null}
              {template.previewCouple ? (
                <div
                  aria-label={`${template.previewCouple[0]} a ${template.previewCouple[1]}`}
                  style={{
                    ...templateCoupleStyle,
                    ...templatePreviewStyles[template.previewCoupleStyle],
                  }}
                >
                  {template.previewEyebrow ? <small style={{ ...templatePreviewEyebrowStyle, ...(template.previewCoupleStyle === 'cathedral' ? { fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 'clamp(5px,.65vw,8px)', letterSpacing: '.1em', fontStyle: 'normal', textTransform: 'uppercase' } : {}) }}>{template.previewEyebrow}</small> : null}
                  <span style={{ ...templateCoupleNamesStyle, ...templateCoupleNameStyles[template.previewCoupleStyle], fontFamily: getWeddingHeroFonts(template.previewCoupleStyle).names }}>
                    <span>{template.previewCouple[0]}</span>
                    <i style={{ ...templateCoupleAmpersandStyle, ...templateAmpersandStyles[template.previewCoupleStyle], fontFamily: getWeddingHeroFonts(template.previewCoupleStyle).joiner, fontStyle: getWeddingHeroFonts(template.previewCoupleStyle).joinerStyle }}>{template.previewJoiner || '&'}</i>
                    <span>{template.previewCouple[1]}</span>
                  </span>
                  {template.previewDate ? <strong style={{ ...templatePreviewDateStyle, ...(template.previewCoupleStyle === 'cathedral' ? { fontSize: 'clamp(4px,.5vw,6px)', letterSpacing: '.08em', marginTop: '1em' } : {}) }}>{template.previewDate}</strong> : null}
                </div>
              ) : null}
            </div>
            <h3 className={serifClassName} style={templateNameStyle}>
              {template.name}
            </h3>
            <p className={styles.templateDescription} style={templateToneStyle}>{template.description}</p>

            <div style={templateActionStyle}>
              {template.href ? (
                <Link href={getTemplateDemoHref(template)} style={templateLinkStyle}>
                  Vyskúšať šablónu zadarmo
                </Link>
              ) : (
                <span style={templateComingSoonStyle}>Pripravujeme</span>
              )}
              <p className={styles.templateNote}>Web, pozvánka aj klientska zóna.<br />Bez registrácie a bez platby.</p>
            </div>
          </article>
        ))}
      </TemplateGallery>
    </section>
  )
}



function getTemplateDemoHref(template) {
  const [path, query = ''] = template.href.split('?')
  const params = new URLSearchParams(query)
  params.set('first', template.previewCouple[0])
  params.set('second', template.previewCouple[1])
  return `${path}?${params}`
}


function PersonalPanel() {
  return <section id="o-yesday" className={`${styles.section} ${styles.personal}`}>
    <div className={styles.personalQuote}>
      <p className={styles.eyebrow}>Za YesDay stojí skutočný svadobný príbeh</p>
      <blockquote>„Vydávala som sa ako mama dvoch detí. Viem, aké náročné je popri prípravách odpisovať na desiatky správ.“</blockquote>
      <p className={styles.copy}><strong>Som Diana, autorka YesDay.</strong> Vytvorila som ho, aby ďalším párom zostalo viac času na svadobné prípravy, rodinu a na seba. Menej hľadania v správach, viac pokoja pred vaším dňom.</p>
      <a href="mailto:info.yesdaystudio@gmail.com">Napíšte mi →</a>
    </div>
    <div>
      <p className={styles.eyebrow}>Čo dostanete a kto vám pomôže</p>
      <h2 className={styles.heading}>Krásny výsledok.<br />Aj pomoc, keď ju potrebujete.</h2>
      <ol className={styles.steps}>
        <li><div><strong>Prístup do vašej klientskej zóny</strong>Po potvrdení platby dostanete e-mail s prístupom k vlastnému projektu a zvolenému dizajnu.</div></li>
        <li><div><strong>Váš obsah, vaše svadobné detaily</strong>V editore doplníte mená, miesta, program a texty. Získate web, pozvánku a QR kartičku na stiahnutie. Tlač si zabezpečíte podľa seba.</div></li>
        <li><div><strong>Odpovede hostí na jednom mieste</strong>Zdieľate web alebo QR kód. Potvrdenia účasti a výber jedla sa zobrazia v prehľade; Signature a Atelier pridajú aj ubytovanie a dopravu.</div></li>
      </ol>
      <p className={styles.copy}>Neviete sa prihlásiť alebo si poradiť s editorom? Napíšte na <a href="mailto:info.yesdaystudio@gmail.com">info.yesdaystudio@gmail.com</a>. Pomoc s používaním je v Essential aj Signature. Ak chcete osobnú tvorbu textov a dizajnu, dohodneme ju v Atelieri.</p>
    </div>
  </section>
}

function Questions() {
  const questions = [
    ['Čím sa YesDay líši od digitálnej pozvánky?', 'Pozvánka oznámi dátum a miesto. YesDay navyše zhromaždí informácie pre hostí, zozbiera potvrdenia účasti a výber jedla a zobrazí ich vo vašej klientskej zóne. Signature a Atelier pomôžu aj s ubytovaním a dopravou.'],
    ['Potrebujeme vedieť robiť web?', 'Nie. Vyberiete si pripravený dizajn a v editore upravíte mená, texty a detaily svadby. Pred rozhodnutím si môžete všetko vyskúšať bez registrácie. Ak sa pri používaní zaseknete, napíšte nám.'],
    ['Dostaneme aj vytlačené pozvánky?', 'Balík obsahuje digitálne tlačoviny na stiahnutie. Fyzická tlač ani doručenie nie sú zahrnuté. Pozvánku a kartičky si môžete dať vytlačiť vo vybranej tlačiarni.'],
    ['Musia sa hostia registrovať?', 'Nie. Otvoria svadobný web cez odkaz alebo QR kód a vyplnia odpoveď. Klientsky účet používate vy, aby ste mali svoje svadobné údaje a odpovede prehľadne spolu.'],
    ['Čo ak niekto nepoužíva QR kódy?', 'Na svadobný web sa dostane aj cez bežný odkaz. QR kód je len jednoduchá cesta z papierovej kartičky do mobilu.'],
    ['Ktorý balík si vybrať?', 'Essential je základ so zladeným webom, pozvánkou, QR kartičkou a prehľadom účasti. Signature zvoľte, ak riešite aj ubytovanie, dopravu, osobné QR pozvánky a galériu. Atelier je na individuálnu tvorbu podľa dohody.'],
  ]
  return <section id="otazky" className={styles.section}><div className={styles.faq}><p className={styles.eyebrow}>Ešte pred výberom</p><h2 className={styles.heading}>Možno vám práve napadlo…</h2>{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
}

function FinalInvitation() {
  return <section className={styles.finalCta}><p className={styles.eyebrow}>Predstavte si vašu svadbu s YesDay</p><h2 className={styles.heading}>Vyberte si štýl.<br />Vyskúšajte, čo vám uľahčí.</h2><p className={styles.copy}>Bez registrácie a bez platby. Najprv si ho pokojne prezrite.</p><Link href="#portfolio" className={styles.linkButton}>Nájsť náš svadobný štýl</Link></section>
}

function Contact() {
  return (
    <section id="kontakt" style={sectionStyle}>
      <h2 className={serifClassName} style={sectionHeadingStyle}>
        Kontakty
      </h2>
      <p style={sectionIntroStyle}>
        Ak máte otázky alebo chcete potvrdiť detaily pred spustením, ozvite sa nám.
      </p>
      <div style={contactGridStyle}>
        <article style={contactCardStyle}>
          <p style={sectionLabelStyle}>E-mail</p>
          <h3 className={serifClassName} style={contactTitleStyle}>
            Napíš nám
          </h3>
          <a href="mailto:info.yesdaystudio@gmail.com" style={contactLinkStyle}>
            info.yesdaystudio@gmail.com
          </a>
        </article>
        <article style={contactCardStyle}>
          <p style={sectionLabelStyle}>Klientska zóna</p>
          <h3 className={serifClassName} style={contactTitleStyle}>
            Vstup pre klientov
          </h3>
          <p style={clientAccessNoteStyle}>Prístup získate po zakúpení svadobného balíka.</p>
          <Link href="/login" style={contactLinkStyle}>
            Prihlásiť sa
          </Link>
        </article>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={footerStyle}>
      <a href="https://www.instagram.com/yesdaystudio/" target="_blank" rel="noreferrer" style={footerLinkStyle}>
        @yesdaystudio
      </a>
      <p style={footerTextStyle}>&copy; {new Date().getFullYear()} YesDay Studio</p>
    </footer>
  )
}

const COLOR_CREAM = '#f4f1ea'
const COLOR_GOLD = '#d4af37'
const COLOR_DARK = '#1a1a1a'
const COLOR_WHITE = '#ffffff'
const COLOR_GREY = '#666'
const COLOR_BORDER = '#e9e9e9'

const pageStyle = {
  margin: 0,
  backgroundColor: COLOR_CREAM,
  color: COLOR_DARK,
  lineHeight: 1.6,
}




const heroStyle = {
  minHeight: '86vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '150px 20px 90px',
  background:
    'radial-gradient(circle at top, rgba(212, 175, 55, 0.10), transparent 35%), linear-gradient(180deg, #fcfaf5 0%, #f7f2e8 100%)',
}

const heroInnerStyle = {
  maxWidth: '920px',
  margin: '0 auto',
}

const heroBrandStyle = {
  marginBottom: '26px',
}

const heroLogoStyle = {
  fontSize: 'clamp(2.5rem, 6vw, 4.2rem)',
  letterSpacing: '5px',
  lineHeight: 1,
  color: COLOR_DARK,
  margin: 0,
}

const heroSubBrandStyle = {
  fontWeight: 300,
  letterSpacing: '8px',
  fontSize: '0.92rem',
  marginTop: '8px',
  textTransform: 'uppercase',
  color: COLOR_DARK,
}

const heroEyebrowStyle = {
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '2.4px',
  color: COLOR_GOLD,
  fontWeight: 600,
  marginBottom: '18px',
}

const heroHeadingStyle = {
  maxWidth: '820px',
  fontSize: 'clamp(2.15rem, 4.7vw, 3.85rem)',
  fontWeight: 400,
  lineHeight: 1.12,
  letterSpacing: '-0.02em',
  textWrap: 'balance',
  margin: '0 auto',
  color: COLOR_DARK,
}

const heroDividerStyle = {
  width: '56px',
  height: '1px',
  background: COLOR_GOLD,
  margin: '28px auto',
}

const heroLeadStyle = {
  maxWidth: '760px',
  margin: '0 auto',
  fontSize: '1.08rem',
  lineHeight: 1.9,
  color: '#5f5a52',
}

const heroActionsStyle = {
  marginTop: '34px',
  display: 'flex',
  justifyContent: 'center',
  gap: '14px',
  flexWrap: 'wrap',
}

const heroButtonBaseStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '220px',
  padding: '15px 24px',
  textDecoration: 'none',
  textTransform: 'uppercase',
  letterSpacing: '1.8px',
  fontSize: '0.74rem',
  fontWeight: 600,
  border: '1px solid transparent',
}

const heroPrimaryButtonStyle = {
  ...heroButtonBaseStyle,
  background: COLOR_DARK,
  color: COLOR_WHITE,
}

const heroSecondaryButtonStyle = {
  ...heroButtonBaseStyle,
  background: 'transparent',
  color: COLOR_DARK,
  borderColor: COLOR_BORDER,
}

const sectionStyle = {
  padding: '85px 20px',
  maxWidth: '1140px',
  margin: '0 auto',
  textAlign: 'center',
  scrollMarginTop: '110px',
}

const systemSectionStyle = {
  padding: '70px 20px',
  background: COLOR_WHITE,
}

const systemInnerStyle = {
  maxWidth: '1140px',
  margin: '0 auto',
  textAlign: 'center',
}

const systemHeadingStyle = {
  maxWidth: '780px',
  margin: '0 auto 20px',
  fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
  lineHeight: 1.2,
  fontWeight: 400,
}

const systemIntroStyle = {
  maxWidth: '780px',
  margin: '0 auto 48px',
  color: COLOR_GREY,
  fontSize: '1rem',
  lineHeight: 1.9,
}

const systemClosingStyle = {
  maxWidth: '830px',
  margin: '48px auto 0',
  color: COLOR_DARK,
  fontSize: 'clamp(1.35rem, 3vw, 2rem)',
  fontWeight: 400,
  lineHeight: 1.5,
}

const sectionHeadingBlockStyle = {
  maxWidth: '760px',
  margin: '0 auto',
}

const sectionLabelStyle = {
  fontSize: '0.72rem',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: COLOR_GOLD,
  marginBottom: '10px',
  fontWeight: 600,
}

const sectionHeadingStyle = {
  fontSize: 'clamp(2rem, 4vw, 2.8rem)',
  marginBottom: '18px',
}


const sectionIntroStyle = {
  maxWidth: '760px',
  margin: '0 auto 45px',
  color: COLOR_GREY,
  fontSize: '0.98rem',
}






const templateCardStyle = {
  background: COLOR_WHITE,
  border: `1px solid ${COLOR_BORDER}`,
  padding: '36px 30px',
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'column',
}

const templatePreviewStyle = {
  position: 'relative',
  width: '100%',
  aspectRatio: '4 / 3',
  border: `1px solid ${COLOR_BORDER}`,
  marginBottom: '20px',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
}

const templateCoupleStyle = {
  position: 'absolute',
  inset: 0,
  zIndex: 2,
  display: 'grid',
  alignContent: 'center',
  justifyItems: 'center',
  fontWeight: 400,
  textAlign: 'center',
}

const templateCoupleNamesStyle = {
  display: 'grid',
  justifyItems: 'center',
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: 'clamp(1.6rem, 3vw, 2.65rem)',
  fontWeight: 400,
  letterSpacing: '-0.035em',
  lineHeight: 0.8,
}

const penelopePreviewCoupleStyle = {
  color: '#5a3f45',
}

const templateCoupleAmpersandStyle = {
  margin: '0.22em 0 0.14em',
  fontFamily: '"Great Vibes", cursive',
  fontSize: '0.68em',
  fontWeight: 400,
  lineHeight: 0.85,
}

const botaniquePreviewCoupleStyle = {
  color: '#26362b',
}

const dianaPreviewCoupleStyle = {
  color: '#704a43',
}

const chloePreviewCoupleStyle = {
  color: '#344f50',
}

const fleuriePreviewCoupleStyle = {
  inset: '4% 5% 40%',
  color: '#6e444b',
}

const provencePreviewCoupleStyle = {
  inset: '0 48% 0 0',
  color: '#68546c',
  background: 'rgba(243,238,228,.9)',
  boxShadow: '16px 0 34px rgba(63,57,56,.08)',
}

const lavandePreviewCoupleStyle = {
  color: '#5f526f',
  background: 'radial-gradient(ellipse at center,rgba(251,248,241,.88),rgba(251,248,241,.36) 60%,transparent)',
}

const templatePreviewStyles = {
  cathedral: { color: '#42658a', background: 'transparent' },
  riviera: { color: '#fffdf4', background: 'linear-gradient(180deg,#163a6533,transparent)', textShadow: '0 2px 14px #14375999' },
  diana: dianaPreviewCoupleStyle,
  penelope: penelopePreviewCoupleStyle,
  botanique: botaniquePreviewCoupleStyle,
  chloe: chloePreviewCoupleStyle,
  fleurie: fleuriePreviewCoupleStyle,
  provence: provencePreviewCoupleStyle,
  lavande: lavandePreviewCoupleStyle,
  veno: { color: '#71343f', width: '65%', marginRight: 'auto', background: 'linear-gradient(90deg,#f5f0e6 65%,#f5f0e600)' },
}

const templateCoupleNameStyles = {
  cathedral: { fontSize: 'clamp(2rem, 3.5vw, 3.3rem)', fontWeight: 400, letterSpacing: '0', lineHeight: .95 },
  riviera: { fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 'clamp(2rem, 3.6vw, 3.5rem)', fontStyle: 'italic', fontWeight: 400, lineHeight: .9 },
  veno: { fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 'clamp(1.9rem, 3.4vw, 3.4rem)', fontWeight: 400, lineHeight: .95 },
  diana: {
    fontFamily: '"Great Vibes", cursive',
    fontSize: 'clamp(2.35rem, 4.7vw, 4.2rem)',
    lineHeight: 0.76,
    transform: 'translateY(-3%)',
  },
  penelope: {
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    fontSize: 'clamp(1.75rem, 3.35vw, 3rem)',
    fontStyle: 'italic',
    lineHeight: 0.72,
  },
  botanique: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.22em',
    fontFamily: '"Great Vibes", cursive',
    fontSize: 'clamp(1.75rem, 3.35vw, 3.15rem)',
    letterSpacing: 0,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  chloe: {
    fontFamily: '"Ms Madi", cursive',
    fontSize: 'clamp(2.45rem, 4.8vw, 4.25rem)',
    letterSpacing: 0,
    lineHeight: 0.68,
  },
  fleurie: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.18em',
    fontFamily: '"WindSong", cursive',
    fontSize: 'clamp(1.8rem, 3vw, 2.75rem)',
    letterSpacing: 0,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  provence: {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: 'clamp(1.7rem, 3.25vw, 2.9rem)',
    fontStyle: 'italic',
    letterSpacing: '-.045em',
    lineHeight: .78,
  },
  lavande: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '.16em',
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    fontSize: 'clamp(1.8rem, 3.6vw, 3.35rem)',
    fontStyle: 'italic',
    letterSpacing: '-.045em',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
}

const templateAmpersandStyles = {
  cathedral: { fontSize: '.45em', margin: '.25em 0', lineHeight: 1 },
  riviera: { fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '.45em', margin: '.2em 0', lineHeight: 1 },
  veno: { fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '.4em', margin: '.3em 0', lineHeight: 1 },
  diana: {
    margin: '0.32em 0 0.58em',
    transform: 'translateX(0.9em)',
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: '0.3em',
    lineHeight: 1,
  },
  penelope: { color: '#a7727d' },
  botanique: {
    margin: '0 0.08em',
    fontFamily: 'inherit',
    fontSize: '0.52em',
    lineHeight: 1,
  },
  chloe: {
    margin: '0.08em 0 0.03em',
    fontFamily: 'inherit',
    fontSize: '0.48em',
  },
  fleurie: {
    margin: '0 0.06em',
    fontFamily: 'inherit',
    fontSize: '0.52em',
    lineHeight: 1,
  },
  provence: {
    margin: '.2em 0 .14em',
    color: '#a79bb7',
    fontFamily: '"Ms Madi", cursive',
    fontSize: '.66em',
    lineHeight: 1,
  },
  lavande: {
    margin: '0 .06em',
    color: '#9b8eaf',
    fontFamily: '"Ms Madi", cursive',
    fontSize: '.62em',
    lineHeight: 1,
  },
}

const templatePreviewEyebrowStyle = {
  marginBottom: '1.25em',
  fontFamily: '"Montserrat", Arial, sans-serif',
  fontSize: 'clamp(0.38rem, 0.68vw, 0.52rem)',
  fontWeight: 500,
  letterSpacing: '0.34em',
  textTransform: 'uppercase',
}

const templatePreviewDateStyle = {
  marginTop: '1.7em',
  fontFamily: '"Montserrat", Arial, sans-serif',
  fontSize: 'clamp(0.42rem, 0.72vw, 0.56rem)',
  fontWeight: 500,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
}

const templateDecorationStyle = {
  position: 'absolute',
  zIndex: 1,
  display: 'block',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'contain',
  pointerEvents: 'none',
}

const templateDecorationPlacements = {
  cathedralWindow: { top: '5%', bottom: '5%', right: '3%', width: '42%', backgroundSize: 'contain' },
  fleurieMeadow: { right: '-2%', bottom: '-2%', left: '-2%', height: '56%', backgroundPosition: 'center bottom', backgroundSize: '100% auto' },
  penelopeTop: { top: '-25%', right: '-14%', width: '68%', aspectRatio: '1400 / 933' },
  penelopeBottom: { bottom: '-22%', left: '-4%', width: '42%', aspectRatio: '760 / 643' },
  botaniqueTop: { top: '-8%', left: '-8%', width: '66%', aspectRatio: '860 / 620' },
  botaniqueWash: { inset: '3%', opacity: .23, backgroundSize: '100% 100%' },
  botaniqueBottom: { right: '2%', bottom: '2%', opacity: .74, width: '58%', aspectRatio: '1296 / 1184' },
  chloeLeft: { bottom: '-22%', left: '-8%', width: '37%', aspectRatio: '450 / 600', backgroundPosition: 'bottom left' },
  chloeRight: { right: '-5%', bottom: '-20%', width: '36%', aspectRatio: '450 / 600', backgroundPosition: 'bottom right' },
  lavandeFront: { right: '-8%', bottom: '-13%', left: '-8%', height: '58%', backgroundPosition: 'center bottom', backgroundSize: '100% auto' },
}

const templatePreviewNameStyle = {
  color: 'rgba(62, 57, 49, 0.7)',
  fontSize: 'clamp(1.8rem, 4vw, 2.7rem)',
  letterSpacing: '0.04em',
}

const templateNameStyle = {
  marginTop: 0,
  marginBottom: '14px',
  fontSize: '1.7rem',
}

const templateToneStyle = {
  color: COLOR_GREY,
  margin: 0,
  lineHeight: 1.8,
  flexGrow: 1,
}

const templateActionStyle = {
  marginTop: '26px',
}

const templateLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 18px',
  border: `1px solid ${COLOR_DARK}`,
  color: COLOR_DARK,
  textDecoration: 'none',
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  fontSize: '0.68rem',
  fontWeight: 600,
}

const templateComingSoonStyle = {
  display: 'inline-block',
  color: '#8a7a61',
  textTransform: 'uppercase',
  letterSpacing: '1.6px',
  fontSize: '0.68rem',
  fontWeight: 600,
}

const pricingSectionStyle = {
  background: COLOR_WHITE,
  padding: '85px 20px',
}

const pricingInnerStyle = {
  maxWidth: '1140px',
  margin: '0 auto',
  textAlign: 'center',
}

const pricingGridStyle = {
  display: 'grid',
  gap: '28px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
  alignItems: 'stretch',
}

const priceCardStyle = {
  padding: '36px 30px',
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'left',
  background: COLOR_WHITE,
  border: `1px solid ${COLOR_BORDER}`,
}

const priceCardFeaturedStyle = {
  borderWidth: '2px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
  background: '#fffcf5',
}

const priceLabelStyle = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color: COLOR_GOLD,
  marginBottom: '10px',
  fontWeight: 600,
}

const priceNameStyle = {
  marginTop: 0,
  marginBottom: '14px',
  fontSize: '1.7rem',
}

const priceIntroStyle = {
  color: COLOR_GREY,
  minHeight: '68px',
  marginBottom: '18px',
  fontSize: '0.95rem',
}

const priceListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: '0 0 30px',
  fontSize: '0.92rem',
  lineHeight: 1.8,
  flexGrow: 1,
}

const priceListItemStyle = {
  marginBottom: '10px',
  position: 'relative',
  paddingLeft: '18px',
}

const priceButtonStyle = {
  display: 'inline-block',
  width: '100%',
  textAlign: 'center',
  background: COLOR_DARK,
  color: COLOR_WHITE,
  textDecoration: 'none',
  padding: '15px 22px',
  textTransform: 'uppercase',
  letterSpacing: '2px',
  fontSize: '0.72rem',
  fontWeight: 600,
}

const contactGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '24px',
  marginTop: '30px',
}

const contactCardStyle = {
  background: COLOR_WHITE,
  border: `1px solid ${COLOR_BORDER}`,
  padding: '36px 30px',
  textAlign: 'center',
}

const contactTitleStyle = {
  marginTop: 0,
  marginBottom: '14px',
  fontSize: '1.7rem',
}

const clientAccessNoteStyle = {
  margin: '-4px 0 14px',
  color: COLOR_GREY,
  fontSize: '0.9rem',
  lineHeight: 1.55,
}

const contactLinkStyle = {
  color: COLOR_DARK,
  textDecoration: 'none',
  fontWeight: 500,
  wordBreak: 'break-word',
}

const footerStyle = {
  padding: '60px 20px',
  background: COLOR_DARK,
  color: COLOR_WHITE,
  textAlign: 'center',
}

const footerLinkStyle = {
  color: COLOR_GOLD,
  textDecoration: 'none',
}

const footerTextStyle = {
  marginTop: '12px',
  marginBottom: 0,
}
