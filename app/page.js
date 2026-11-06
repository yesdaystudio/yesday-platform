import Link from 'next/link'
import PricingSection from './components/PricingSection'
import HowItWorksVisual from '../components/HowItWorksVisual'
import DashboardShowcase from '../components/DashboardShowcase'
import { getWeddingHeroFonts } from '../lib/designCustomization'

const serifClassName = 'font-playfair-display'
const sansClassName = 'font-montserrat'

const BENEFITS = [
  {
    title: 'Všetko spolu ladí',
    description:
      'Svadobný web, pozvánka aj QR kartička vzniknú v jednom štýle, prispôsobenom vašej svadbe.',
  },
  {
    title: 'Hostia majú jasno',
    description:
      'Program, miesta, mapy, ubytovanie aj RSVP nájdu jednoducho na vašom svadobnom webe.',
  },
  {
    title: 'Bez ručného prepisovania',
    description:
      'Účasť, deti, jedlá, alergie, doprava a ubytovanie sa z RSVP automaticky uložia do prehľadu.',
  },
  {
    title: 'Ubytovanie vyriešite ľahko',
    description:
      'Priradíte hotel a izbu a hosťovi jedným klikom odošlete pripravený e-mail so všetkými informáciami.',
  },
]

const TEMPLATES = [
  {
    name: 'Diana',
    description:
      'Luxury editorial, old money Italy, black tie elegance and timeless villa atmosphere.',
    previewImage: '/templates/diana/diana-hero-bg.png',
    previewCouple: ['Diana', 'Anton'],
    previewCoupleStyle: 'diana',
    previewJoiner: 'a',
    href: '/ukazka',
  },
  {
    name: 'Lavande',
    description:
      'Maľovaná levanduľová šablóna s olivovníkom, jemným pohybom vo vetre a vzdušnou francúzskou romantikou.',
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
    description: 'Modrobiele more maľované olejom, slnečné citróny a ručne pôsobiaca prímorská keramika.',
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
      'Jemný akvarelový dizajn s gypsomilkou, papierovou textúrou a vzdušnou zelenomodrou paletou.',
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
      'Romantická lúčna šablóna s ručne maľovanými kvetmi, francúzskou ľahkosťou a teplou púdrovou paletou.',
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
    description: 'Súčasná ľudová romantika s autorskou výšivkou, jemnou čipkou a teplým ľanovým podkladom.',
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
      'Romantic floral design family inspired by softness, femininity and fairytale wedding atmosphere.',
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
      'Pokojná provensálska šablóna s levanduľou, prírodným ľanom, kameňom a francúzskym editorial rukopisom.',
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
      'Vzdušná biela pozvánka a web s akvarelovými listami v šalviových a olivových odtieňoch.',
    preview: '#ffffff',
    previewImage: '/templates/botanique/foliage-top-v3.png',
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
    <main className={sansClassName} style={pageStyle}>
      <Nav />
      <Hero />
      <HowItWorks />
      <Templates />
      <section style={systemSectionStyle} aria-label="Ukážka klientskej zóny">
        <div style={systemInnerStyle}><DashboardShowcase /></div>
      </section>
      <Benefits />
      <PricingSection />
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
          Hostia naskenujú QR kód na pozvánke, otvoria si váš svadobný web a
          potvrdia účasť. Vy máte odpovede, stravu, dopravu aj ubytovanie
          prehľadne na jednom mieste.
        </p>

        <HowItWorksVisual />

        <p className={serifClassName} style={systemClosingStyle}>
          Menej zisťovania, prepisovania a odpovedania na rovnaké otázky.
          Viac pokoja, istoty a času tešiť sa na váš deň.
        </p>

      </div>
    </section>
  )
}

function Nav() {
  return (
    <header style={navStyle}>
      <nav style={navInnerStyle}>
        <Link href="#portfolio" style={navLinkStyle}>
          Šablóny
        </Link>
        <Link href="#cennik" style={navLinkStyle}>
          Ponuka
        </Link>
        <Link href="#kontakt" style={navLinkStyle}>
          Kontakty
        </Link>
        <Link href="/login" style={navLinkStyle}>
          Klientska zóna
        </Link>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section style={heroStyle}>
      <div style={heroInnerStyle}>
        <div style={heroBrandStyle}>
          <p className={serifClassName} style={heroLogoStyle}>
            YES DAY
          </p>
          <p style={heroSubBrandStyle}>STUDIO</p>
        </div>

        <p style={heroEyebrowStyle}>Digitálne svadobné riešenia na mieru v zladenom štýle</p>

        <h1 className={serifClassName} style={heroHeadingStyle}>
          Váš svadobný web a pozvánky v jednom štýle.
        </h1>

        <div style={heroDividerStyle} />

        <p style={heroLeadStyle}>
          Vyberte si dizajn pre váš deň. Pozvánky, web aj odpovede hostí budú krásne ladiť.
        </p>

        <div style={heroActionsStyle}>
          <Link href="#portfolio" style={heroPrimaryButtonStyle}>
            Vybrať svadobný dizajn ↓
          </Link>
          <Link href="/ukazka" style={heroSecondaryButtonStyle}>
            Vyskúšať s vlastnými údajmi
          </Link>
        </div>
      </div>
    </section>
  )
}

function Benefits() {
  return (
    <section style={sectionStyle}>
      <div style={sectionHeadingBlockStyle}>
        <p style={sectionLabelStyle}>Prečo YesDay</p>
        <h2 className={serifClassName} style={benefitsHeadingStyle}>
          Krásny zážitok pre hostí. Menej starostí pre vás.
        </h2>
        <p style={sectionIntroStyle}>
          Získate zladený svadobný web, pozvánku a QR kartičku spolu s RSVP,
          prehľadom hostí a ubytovaním. Jeden systém, ktorý dobre vyzerá a zároveň
          vám reálne šetrí čas.
        </p>
      </div>

      <div style={benefitsGridStyle}>
        {BENEFITS.map((benefit) => (
          <article key={benefit.title} style={benefitCardStyle}>
            <h3 className={serifClassName} style={benefitTitleStyle}>
              {benefit.title}
            </h3>
            <p style={benefitDescriptionStyle}>{benefit.description}</p>
          </article>
        ))}
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
        Deväť dizajnových rodín. V každej zladený svadobný web, pozvánky a QR kartičky.
      </p>

      <div style={templatesGridStyle}>
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
                  {template.previewEyebrow ? <small style={templatePreviewEyebrowStyle}>{template.previewEyebrow}</small> : null}
                  <span style={{ ...templateCoupleNamesStyle, ...templateCoupleNameStyles[template.previewCoupleStyle], fontFamily: getWeddingHeroFonts(template.previewCoupleStyle).names }}>
                    <span>{template.previewCouple[0]}</span>
                    <i style={{ ...templateCoupleAmpersandStyle, ...templateAmpersandStyles[template.previewCoupleStyle], fontFamily: getWeddingHeroFonts(template.previewCoupleStyle).joiner, fontStyle: getWeddingHeroFonts(template.previewCoupleStyle).joinerStyle }}>{template.previewJoiner || '&'}</i>
                    <span>{template.previewCouple[1]}</span>
                  </span>
                  {template.previewDate ? <strong style={templatePreviewDateStyle}>{template.previewDate}</strong> : null}
                </div>
              ) : null}
            </div>
            <h3 className={serifClassName} style={templateNameStyle}>
              {template.name}
            </h3>
            <p style={templateToneStyle}>{template.description}</p>

            <div style={templateActionStyle}>
              {template.href ? (
                <Link href={getTemplateDemoHref(template)} style={templateLinkStyle}>
                  Vyskúšať web, pozvánku aj dashboard
                </Link>
              ) : (
                <span style={templateComingSoonStyle}>Pripravujeme</span>
              )}
            </div>
          </article>
        ))}
      </div>
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

const navStyle = {
  background: 'rgba(255, 255, 255, 0.96)',
  padding: '18px 20px',
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  backdropFilter: 'blur(8px)',
}

const navInnerStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '28px',
  flexWrap: 'wrap',
}

const navLinkStyle = {
  textDecoration: 'none',
  color: COLOR_DARK,
  fontSize: '12px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  fontWeight: 500,
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
  padding: '95px 20px',
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

const benefitsHeadingStyle = {
  maxWidth: '820px',
  margin: '0 auto 18px',
  fontSize: 'clamp(2rem, 4vw, 3rem)',
  fontWeight: 400,
  lineHeight: 1.18,
  textWrap: 'balance',
}

const sectionIntroStyle = {
  maxWidth: '760px',
  margin: '0 auto 45px',
  color: COLOR_GREY,
  fontSize: '0.98rem',
}

const benefitsGridStyle = {
  maxWidth: '960px',
  margin: '50px auto 0',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
  gap: '24px',
}

const benefitCardStyle = {
  background: COLOR_WHITE,
  border: `1px solid ${COLOR_BORDER}`,
  padding: '36px 34px',
  textAlign: 'left',
}

const benefitTitleStyle = {
  fontSize: '1.5rem',
  margin: '0 0 12px',
  color: COLOR_DARK,
}

const benefitDescriptionStyle = {
  color: '#5f5a52',
  lineHeight: 1.8,
  margin: 0,
}

const templatesGridStyle = {
  display: 'grid',
  gap: '28px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
