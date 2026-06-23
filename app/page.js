import Link from 'next/link'
import { Montserrat, Playfair_Display } from 'next/font/google'
import PricingSection from './components/PricingSection'

const serif = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
})

const sans = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
})

const BENEFITS = [
  {
    title: 'Všetko dôležité v jednom QR kóde',
    description:
      'Hostia naskenujú QR kód na pozvánke a okamžite sa dostanú ku kľúčovým informáciám - od harmonogramu po praktické detaily.',
  },
  {
    title: 'Dokonalý vizuálny súlad',
    description:
      'Pozvánka, svadobný web a ďalšie výstupy môžu pôsobiť ako jeden premyslený celok s jednotným štýlom.',
  },
  {
    title: 'Menej chaosu okolo RSVP',
    description:
      'Odpovede hostí vidíte prehľadne na jednom mieste bez telefonátov, tabuliek a nejasností.',
  },
  {
    title: 'Flexibilné riešenie bez stresu',
    description:
      'Ak sa niečo zmení, informácie na webe upravíte rýchlo. Komunikácia ostáva aktuálna a čistá.',
  },
]

const TEMPLATES = [
  {
    name: 'Diana',
    description:
      'Luxury editorial, old money Italy, black tie elegance and timeless villa atmosphere.',
    previewImage: '/templates/diana/diana-anton-hero.png',
    href: '/diana-anton',
  },
  {
    name: 'Penelope',
    description:
      'Romantic floral design family inspired by softness, femininity and fairytale wedding atmosphere.',
    preview:
      'radial-gradient(circle at 18% 15%, rgba(255,255,255,0.9), transparent 28%), linear-gradient(145deg, #f8eee9 0%, #e8d4d1 100%)',
    comingSoon: true,
  },
  {
    name: 'Botanique',
    description:
      'Natural garden design family with relaxed authentic styling, greenery, brick, ivy and wild garden atmosphere.',
    preview:
      'radial-gradient(circle at 82% 18%, rgba(255,255,255,0.38), transparent 30%), linear-gradient(145deg, #dfe4d7 0%, #aeb9a4 100%)',
    comingSoon: true,
  },
]



export default function HomePage() {
  return (
    <main className={sans.className} style={pageStyle}>
      <Nav />
      <Hero />
      <Benefits />
      <Templates />
      <PricingSection />
      <Contact />
      <Footer />
    </main>
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
          <p className={serif.className} style={heroLogoStyle}>
            YES DAY
          </p>
          <p style={heroSubBrandStyle}>STUDIO</p>
        </div>

        <p style={heroEyebrowStyle}>Digitálne svadobné riešenia na mieru v zladenom štýle</p>

        <h1 className={serif.className} style={heroHeadingStyle}>
          Viac radosti zo svadby,
          <br />
          menej chaosu.
        </h1>

        <div style={heroDividerStyle} />

        <p style={heroLeadStyle}>
          Elegantný digitálny priestor pre váš svadobný web, hostí a organizáciu.
          Prepojte svadobné pozvánky s výhodami moderného svadobného webu.
          Vďaka jednému QR kódu budú mať hostia všetko dôležité vždy po ruke.
        </p>

        <div style={heroActionsStyle}>
          <Link href="#portfolio" style={heroPrimaryButtonStyle}>
            Pozrieť šablóny
          </Link>
          <Link href="#cennik" style={heroSecondaryButtonStyle}>
            Porovnať balíky
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
        <p style={sectionLabelStyle}>Prečo spojiť pozvánku a svadobný web</p>
        <h2 className={serif.className} style={sectionHeadingStyle}>
          Premyslený systém pre pár aj hostí
        </h2>
        <p style={sectionIntroStyle}>
          Nekupujete len pekný dizajn. Získavate pokojnú organizáciu, jasnú
          komunikáciu a jednotný výsledok, ktorý pôsobí kvalitne od prvého dojmu.
        </p>
      </div>

      <div style={benefitsGridStyle}>
        {BENEFITS.map((benefit) => (
          <article key={benefit.title} style={benefitCardStyle}>
            <h3 className={serif.className} style={benefitTitleStyle}>
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
      <h2 className={serif.className} style={sectionHeadingStyle}>
        Templates / Design families
      </h2>
      <p style={sectionIntroStyle}>
        Vyberte si dizajnovú rodinu, ktorá určí atmosféru vášho svadobného webu.
        Každú z nich doladíme na váš príbeh, štýl komunikácie a svadobný deň.
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
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                  }
                  : {}),
              }}
            >
              {!template.previewImage ? (
                <span className={serif.className} style={templatePreviewNameStyle}>
                  {template.name}
                </span>
              ) : null}
            </div>
            <h3 className={serif.className} style={templateNameStyle}>
              {template.name}
            </h3>
            <p style={templateToneStyle}>{template.description}</p>

            <div style={templateActionStyle}>
              {template.href ? (
                <Link href={template.href} style={templateLinkStyle}>
                  Pozrieť ukážku
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



function Contact() {
  return (
    <section id="kontakt" style={sectionStyle}>
      <h2 className={serif.className} style={sectionHeadingStyle}>
        Kontakty
      </h2>
      <p style={sectionIntroStyle}>
        Ak máte otázky alebo chcete potvrdiť detaily pred spustením, ozvite sa nám.
      </p>
      <div style={contactGridStyle}>
        <article style={contactCardStyle}>
          <p style={sectionLabelStyle}>E-mail</p>
          <h3 className={serif.className} style={contactTitleStyle}>
            Napíš nám
          </h3>
          <a href="mailto:info.yesdaystudio@gmail.com" style={contactLinkStyle}>
            info.yesdaystudio@gmail.com
          </a>
        </article>
        <article style={contactCardStyle}>
          <p style={sectionLabelStyle}>Klientska zóna</p>
          <h3 className={serif.className} style={contactTitleStyle}>
            Vstup pre klientov
          </h3>
          <Link href="/login" style={contactLinkStyle}>
            Otvoriť /login
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
  fontSize: 'clamp(2.8rem, 7vw, 5rem)',
  lineHeight: 1.08,
  letterSpacing: '-0.5px',
  margin: 0,
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

const benefitsGridStyle = {
  maxWidth: '1180px',
  margin: '50px auto 0',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '24px',
}

const benefitCardStyle = {
  background: COLOR_WHITE,
  border: `1px solid ${COLOR_BORDER}`,
  padding: '32px 28px',
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
  width: '100%',
  aspectRatio: '4 / 3',
  border: `1px solid ${COLOR_BORDER}`,
  marginBottom: '20px',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
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
