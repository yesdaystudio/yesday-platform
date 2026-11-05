import Link from 'next/link'
import PricingSection from './components/PricingSection'
import HowItWorksVisual from '../components/HowItWorksVisual'
import DashboardShowcase from '../components/DashboardShowcase'
import DesignFamilyPreview from '../components/DesignFamilyPreview'

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
  { name: 'Diana', design: 'diana', description: 'Nadčasová elegancia, jemný satén a romantická kaligrafia.', href: '/ukazka' },
  { name: 'Lavande', design: 'lavande', description: 'Maľovaná levanduľa, olivovník a vzdušná francúzska romantika.', href: '/ukazka?design=lavande' },
  { name: 'Riviera', design: 'riviera', description: 'Modrobiele more maľované olejom, slnečné citróny a prímorská keramika.', href: '/ukazka?design=riviera' },
  { name: 'Chloe', design: 'chloe', description: 'Jemný akvarel s gypsomilkou, papierovou textúrou a zelenomodrou paletou.', href: '/ukazka?design=chloe' },
  { name: 'Fleurie', design: 'fleurie', description: 'Ručne maľované lúčne kvety, francúzska ľahkosť a teplé púdrové tóny.', href: '/ukazka?design=fleurie' },
  { name: 'Veno', design: 'veno', description: 'Súčasná ľudová romantika s výšivkou, čipkou a teplým ľanovým podkladom.', href: '/ukazka?design=veno' },
  { name: 'Penelope', design: 'penelope', description: 'Nežné kvety, akvarelové detaily a romantická svadobná atmosféra.', href: '/ukazka?design=penelope' },
  { name: 'Provence', design: 'provence', description: 'Pokojná provensálska záhrada, levanduľa, prírodný ľan a kameň.', href: '/ukazka?design=provence' },
  { name: 'Botanique', design: 'botanique', description: 'Prirodzená záhradná atmosféra so zeleňou, brečtanom a jemným akvarelom.', href: '/ukazka?design=botanique' },
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
            <DesignFamilyPreview design={template.design} name={template.name} href={template.href} />
            <h3 className={serifClassName} style={templateNameStyle}>
              {template.name}
            </h3>
            <p style={templateToneStyle}>{template.description}</p>

            <div style={templateActionStyle}>
              {template.href ? (
                <Link href={template.href} style={templateLinkStyle}>
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
