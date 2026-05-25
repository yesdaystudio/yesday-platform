import Link from 'next/link'

export const metadata = {
  title: 'YesDay Studio — Svadobné weby s charakterom',
  description:
    'Elegantný digitálny priestor pre váš svadobný web, hostí a organizáciu. Prepojte svadobné pozvánky s výhodami moderného svadobného webu.',
}

const FEATURES = [
  {
    title: 'Svadobný web',
    description:
      'Elegantná stránka s príbehom páru, programom dňa a všetkými informáciami pre hostí na jednom mieste.',
  },
  {
    title: 'RSVP',
    description:
      'Digitálne potvrdenia účasti s prehľadom odpovedí v reálnom čase. Žiadne telefonovanie, žiadny chaos.',
  },
  {
    title: 'Správa hostí',
    description:
      'Prehľad všetkých hostí, ich potvrdení, jedálneho výberu a špeciálnych požiadaviek na jednom mieste.',
  },
  {
    title: 'QR kód',
    description:
      'Jeden QR kód na svadobné oznámenie otvorí hosťom kompletný svadobný web. Moderné, jednoduché, elegantné.',
  },
  {
    title: 'Klientska zóna',
    description:
      'Súkromný portál pre editáciu webu, sledovanie RSVP a správu hostí kedykoľvek a kdekoľvek.',
  },
  {
    title: 'Ubytovanie',
    badge: 'Signature+',
    description:
      'Správa ubytovacích kapacít a priradenie izieb priamo v klientskej zóne bez ďalšej réžie.',
  },
  {
    title: 'Galéria po svadbe',
    badge: 'Signature+',
    description:
      'Zdieľajte svadobné fotografie s hosťami v privátnej galérii priamo na vašom svadobnom webe.',
  },
]

const PACKAGES = [
  {
    name: 'Essential',
    description: 'Elegantný základ pre každú svadbu.',
    items: [
      'Svadobný web',
      'RSVP',
      'Zdieľaný QR kód',
      'Kurátorovaná personalizácia',
      'Max 1 fotografia',
    ],
    highlight: false,
  },
  {
    name: 'Signature',
    description: 'Plný zážitok pre náročných párov.',
    items: [
      'Všetko z Essential',
      'Bohatšia personalizácia',
      'Max 3 fotografie',
      'Voliteľné ubytovanie hostí',
      'Vlastné RSVP otázky',
      'Galéria po svadbe',
      'Voliteľný unikátny QR',
    ],
    highlight: true,
  },
  {
    name: 'Atelier',
    description: 'Riešenie na mieru pre výnimočné svadby.',
    items: [
      'Riešenie na mieru',
      'Plná personalizácia',
      'Unikátne QR pre každého hosťa',
      'Premium guest logistics',
    ],
    highlight: false,
  },
]

const TEMPLATES = [
  { name: 'Editorial', tone: 'Čistý, kontrastný, moderný' },
  { name: 'Romantic', tone: 'Jemný, vzdušný, srdečný' },
  { name: 'Minimal', tone: 'Strohý, presný, nadčasový' },
  { name: 'Provençal', tone: 'Teplý, rustikálny, organický' },
  { name: 'Modern', tone: 'Dynamický, odvážny, výrazný' },
]

export default function HomePage() {
  return (
    <div style={rootStyle}>
      <Nav />
      <Hero />
      <Features />
      <Pricing />
      <Templates />
      <CtaSection />
      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <header style={navStyle}>
      <div style={navInnerStyle}>
        <Link href="/" style={logoStyle}>
          YesDay Studio
        </Link>
        <nav style={navLinksStyle}>
          <Link href="#sablony" style={navLinkStyle}>Šablóny</Link>
          <Link href="#ponuka" style={navLinkStyle}>Ponuka</Link>
          <Link href="#kontakt" style={navLinkStyle}>Kontakt</Link>
          <Link href="/login" style={navCTAStyle}>Klientska zóna</Link>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section style={heroStyle}>
      <div style={heroInnerStyle}>
        <p style={heroEyebrowStyle}>Svadobné weby s charakterom</p>
        <h1 style={heroHeadlineStyle}>
          Viac radosti zo svadby,<br />menej chaosu.
        </h1>
        <p style={heroSubStyle}>
          Elegantný digitálny priestor pre váš svadobný web, hostí a organizáciu.
        </p>
        <p style={heroBodyStyle}>
          Prepojte svadobné pozvánky s výhodami moderného svadobného webu.
          Vďaka jednému QR kódu budú mať vaši hostia všetky dôležité informácie
          vždy po ruke — a vy získate viac prehľadu, menej stresu
          a harmonický priebeh príprav.
        </p>
        <div style={heroActionsStyle}>
          <Link href="#sablony" style={primaryButtonStyle}>Pozrieť šablóny</Link>
          <Link href="#ponuka" style={secondaryButtonStyle}>Porovnať balíky</Link>
        </div>
      </div>
      <div style={heroDividerStyle} />
    </section>
  )
}

function Features() {
  return (
    <section style={sectionStyle}>
      <div style={sectionInnerStyle}>
        <SectionLabel>Čo získate</SectionLabel>
        <h2 style={sectionHeadingStyle}>Všetko, čo vaša svadba potrebuje.</h2>
        <div style={featuresGridStyle}>
          {FEATURES.map((f) => (
            <div key={f.title} style={featureCardStyle}>
              <div style={featureCardTopStyle}>
                <span style={featureTitleStyle}>{f.title}</span>
                {f.badge ? <span style={badgeStyle}>{f.badge}</span> : null}
              </div>
              <p style={featureDescStyle}>{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="ponuka" style={{ ...sectionStyle, background: '#f0e9e0' }}>
      <div style={sectionInnerStyle}>
        <SectionLabel>Cenové balíky</SectionLabel>
        <h2 style={sectionHeadingStyle}>Zvoľte, čo vám sedí.</h2>
        <div style={pricingGridStyle}>
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.name}
              style={{
                ...pricingCardStyle,
                ...(pkg.highlight ? pricingCardHighlightStyle : {}),
              }}
            >
              {pkg.highlight ? (
                <p style={pricingPopularStyle}>Najobľúbenejší</p>
              ) : null}
              <h3 style={pricingNameStyle}>{pkg.name}</h3>
              <p style={pricingDescStyle}>{pkg.description}</p>
              <ul style={pricingListStyle}>
                {pkg.items.map((item) => (
                  <li key={item} style={pricingItemStyle}>
                    <span style={pricingCheckStyle}>—</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="#kontakt"
                style={{
                  ...pricingCTAStyle,
                  ...(pkg.highlight ? pricingCTAHighlightStyle : {}),
                }}
              >
                Mám záujem
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Templates() {
  return (
    <section id="sablony" style={sectionStyle}>
      <div style={sectionInnerStyle}>
        <SectionLabel>Šablóny</SectionLabel>
        <h2 style={sectionHeadingStyle}>Váš deň, váš štýl.</h2>
        <p style={sectionLeadStyle}>
          Každá šablóna je navrhnutá s dôrazom na detail, čitateľnosť
          a vizuálnu harmóniu. Vyberáte tón, my zabezpečíme dokonalé
          spracovanie.
        </p>
        <div style={templatesGridStyle}>
          {TEMPLATES.map((t) => (
            <div key={t.name} style={templateCardStyle}>
              <div style={templatePreviewStyle} />
              <div style={templateInfoStyle}>
                <span style={templateNameStyle}>{t.name}</span>
                <span style={templateToneStyle}>{t.tone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaSection() {
  return (
    <section id="kontakt" style={ctaSectionStyle}>
      <div style={ctaInnerStyle}>
        <p style={heroEyebrowStyle}>Začnite ešte dnes</p>
        <h2 style={ctaHeadlineStyle}>
          Váš svadobný web je len jedno rozhodnutie ďaleko.
        </h2>
        <p style={ctaBodyStyle}>
          Napíšte nám a spoločne navrhneme digitálny priestor,
          ktorý odráža váš deň presne tak, ako si ho predstavujete.
        </p>
        <a href="mailto:hello@yesdaystudio.com" style={primaryButtonStyle}>
          Napísať nám
        </a>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={footerStyle}>
      <div style={footerInnerStyle}>
        <span style={footerLogoStyle}>YesDay Studio</span>
        <p style={footerTextStyle}>
          &copy; {new Date().getFullYear()} YesDay Studio. Všetky práva vyhradené.
        </p>
        <Link href="/login" style={footerLinkStyle}>Klientska zóna</Link>
      </div>
    </footer>
  )
}

function SectionLabel({ children }) {
  return <p style={sectionLabelStyle}>{children}</p>
}

// — Styles —

const FONT_SERIF = "Georgia, 'Times New Roman', serif"
const FONT_SANS = "system-ui, -apple-system, sans-serif"
const COLOR_INK = '#2c2118'
const COLOR_INK_SOFT = '#5c4a38'
const COLOR_ACCENT = '#8a6f54'
const COLOR_ACCENT_LIGHT = '#b89880'
const COLOR_BG = '#faf6f0'
const COLOR_BORDER = 'rgba(138,111,84,0.16)'

const rootStyle = {
  background: COLOR_BG,
  color: COLOR_INK,
  fontFamily: FONT_SANS,
  minHeight: '100vh',
}

const navStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  background: 'rgba(250,246,240,0.92)',
  backdropFilter: 'blur(12px)',
  borderBottom: `1px solid ${COLOR_BORDER}`,
}

const navInnerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 32px',
  height: '64px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const logoStyle = {
  fontFamily: FONT_SERIF,
  fontSize: '18px',
  fontWeight: 'normal',
  letterSpacing: '0.04em',
  color: COLOR_INK,
  textDecoration: 'none',
}

const navLinksStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '32px',
}

const navLinkStyle = {
  fontFamily: FONT_SANS,
  fontSize: '14px',
  letterSpacing: '0.06em',
  color: COLOR_INK_SOFT,
  textDecoration: 'none',
}

const navCTAStyle = {
  fontFamily: FONT_SANS,
  fontSize: '13px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: COLOR_ACCENT,
  textDecoration: 'none',
  border: `1px solid ${COLOR_BORDER}`,
  padding: '8px 20px',
  borderRadius: '999px',
}

const heroStyle = {
  padding: '120px 32px 80px',
  maxWidth: '1200px',
  margin: '0 auto',
}

const heroInnerStyle = {
  maxWidth: '760px',
}

const heroEyebrowStyle = {
  margin: '0 0 24px',
  fontFamily: FONT_SANS,
  fontSize: '12px',
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: COLOR_ACCENT,
}

const heroHeadlineStyle = {
  margin: '0 0 28px',
  fontFamily: FONT_SERIF,
  fontSize: 'clamp(44px, 6vw, 80px)',
  fontWeight: 'normal',
  lineHeight: 1.12,
  letterSpacing: '-0.01em',
  color: COLOR_INK,
}

const heroSubStyle = {
  margin: '0 0 20px',
  fontFamily: FONT_SANS,
  fontSize: '20px',
  lineHeight: 1.5,
  color: COLOR_INK_SOFT,
  maxWidth: '600px',
}

const heroBodyStyle = {
  margin: '0 0 48px',
  fontFamily: FONT_SANS,
  fontSize: '16px',
  lineHeight: 1.8,
  color: COLOR_ACCENT,
  maxWidth: '600px',
}

const heroActionsStyle = {
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap',
}

const primaryButtonStyle = {
  display: 'inline-block',
  fontFamily: FONT_SANS,
  fontSize: '14px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  color: '#faf6f0',
  background: COLOR_INK,
  padding: '15px 36px',
  borderRadius: '999px',
}

const secondaryButtonStyle = {
  display: 'inline-block',
  fontFamily: FONT_SANS,
  fontSize: '14px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  color: COLOR_INK,
  background: 'transparent',
  padding: '15px 36px',
  borderRadius: '999px',
  border: `1px solid ${COLOR_BORDER}`,
}

const heroDividerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  height: '1px',
  background: COLOR_BORDER,
}

const sectionStyle = {
  padding: '96px 32px',
}

const sectionInnerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
}

const sectionLabelStyle = {
  margin: '0 0 16px',
  fontFamily: FONT_SANS,
  fontSize: '11px',
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: COLOR_ACCENT_LIGHT,
}

const sectionHeadingStyle = {
  margin: '0 0 60px',
  fontFamily: FONT_SERIF,
  fontSize: 'clamp(32px, 4vw, 52px)',
  fontWeight: 'normal',
  lineHeight: 1.2,
  color: COLOR_INK,
}

const sectionLeadStyle = {
  margin: '-36px 0 60px',
  fontFamily: FONT_SANS,
  fontSize: '17px',
  lineHeight: 1.8,
  color: COLOR_INK_SOFT,
  maxWidth: '600px',
}

const featuresGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '1px',
  background: COLOR_BORDER,
  border: `1px solid ${COLOR_BORDER}`,
  borderRadius: '20px',
  overflow: 'hidden',
}

const featureCardStyle = {
  padding: '36px',
  background: COLOR_BG,
}

const featureCardTopStyle = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '10px',
  marginBottom: '14px',
}

const featureTitleStyle = {
  fontFamily: FONT_SERIF,
  fontSize: '20px',
  fontWeight: 'normal',
  color: COLOR_INK,
}

const badgeStyle = {
  fontFamily: FONT_SANS,
  fontSize: '10px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: COLOR_ACCENT,
  border: `1px solid ${COLOR_BORDER}`,
  padding: '2px 8px',
  borderRadius: '999px',
}

const featureDescStyle = {
  margin: 0,
  fontFamily: FONT_SANS,
  fontSize: '14px',
  lineHeight: 1.75,
  color: COLOR_INK_SOFT,
}

const pricingGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '24px',
  alignItems: 'start',
}

const pricingCardStyle = {
  background: COLOR_BG,
  border: `1px solid ${COLOR_BORDER}`,
  borderRadius: '20px',
  padding: '40px 36px',
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
}

const pricingCardHighlightStyle = {
  background: COLOR_INK,
  border: `1px solid ${COLOR_INK}`,
}

const pricingPopularStyle = {
  margin: '0 0 20px',
  fontFamily: FONT_SANS,
  fontSize: '11px',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: COLOR_ACCENT_LIGHT,
}

const pricingNameStyle = {
  margin: '0 0 10px',
  fontFamily: FONT_SERIF,
  fontSize: '32px',
  fontWeight: 'normal',
  color: 'inherit',
}

const pricingDescStyle = {
  margin: '0 0 32px',
  fontFamily: FONT_SANS,
  fontSize: '14px',
  lineHeight: 1.6,
  color: COLOR_ACCENT_LIGHT,
}

const pricingListStyle = {
  margin: '0 0 40px',
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  flexGrow: 1,
}

const pricingItemStyle = {
  display: 'flex',
  gap: '12px',
  fontFamily: FONT_SANS,
  fontSize: '14px',
  lineHeight: 1.5,
  color: 'inherit',
  opacity: 0.85,
}

const pricingCheckStyle = {
  color: COLOR_ACCENT_LIGHT,
  flexShrink: 0,
}

const pricingCTAStyle = {
  display: 'block',
  textAlign: 'center',
  fontFamily: FONT_SANS,
  fontSize: '13px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  color: COLOR_INK,
  background: 'transparent',
  border: `1px solid ${COLOR_BORDER}`,
  padding: '14px 24px',
  borderRadius: '999px',
}

const pricingCTAHighlightStyle = {
  color: COLOR_INK,
  background: COLOR_BG,
  border: `1px solid ${COLOR_BG}`,
}

const templatesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '24px',
}

const templateCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}

const templatePreviewStyle = {
  height: '280px',
  borderRadius: '16px',
  background: 'linear-gradient(160deg, #e8ddd2 0%, #d4c8bb 100%)',
  border: `1px solid ${COLOR_BORDER}`,
}

const templateInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}

const templateNameStyle = {
  fontFamily: FONT_SERIF,
  fontSize: '18px',
  fontWeight: 'normal',
  color: COLOR_INK,
}

const templateToneStyle = {
  fontFamily: FONT_SANS,
  fontSize: '13px',
  color: COLOR_ACCENT,
}

const ctaSectionStyle = {
  padding: '120px 32px',
  background: COLOR_INK,
  color: '#faf6f0',
}

const ctaInnerStyle = {
  maxWidth: '680px',
  margin: '0 auto',
  textAlign: 'center',
}

const ctaHeadlineStyle = {
  margin: '0 0 24px',
  fontFamily: FONT_SERIF,
  fontSize: 'clamp(32px, 4vw, 52px)',
  fontWeight: 'normal',
  lineHeight: 1.2,
  color: '#faf6f0',
}

const ctaBodyStyle = {
  margin: '0 0 48px',
  fontFamily: FONT_SANS,
  fontSize: '16px',
  lineHeight: 1.8,
  color: 'rgba(250,246,240,0.65)',
}

const footerStyle = {
  padding: '40px 32px',
  borderTop: `1px solid ${COLOR_BORDER}`,
}

const footerInnerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '24px',
  flexWrap: 'wrap',
}

const footerLogoStyle = {
  fontFamily: FONT_SERIF,
  fontSize: '15px',
  fontWeight: 'normal',
  color: COLOR_INK,
}

const footerTextStyle = {
  margin: 0,
  fontFamily: FONT_SANS,
  fontSize: '13px',
  color: COLOR_ACCENT,
}

const footerLinkStyle = {
  fontFamily: FONT_SANS,
  fontSize: '13px',
  letterSpacing: '0.08em',
  color: COLOR_ACCENT,
  textDecoration: 'none',
}