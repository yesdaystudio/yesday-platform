'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import CheckoutModal from './CheckoutModal'

const DESIGNS = {
  diana: {
    name: 'Diana',
    image: '/templates/diana/diana-anton-hero.png',
  },
  penelope: {
    name: 'Penelope',
    image: '/templates/penelope/hero-v2.jpg',
  },
  botanique: {
    name: 'Botanique',
    image: '/templates/botanique/hero.jpg',
  },
}

const PACKAGES = [
  {
    name: 'Essential',
    packageType: 'essential',
    price: '129 €',
    label: 'Elegantný digitálny základ',
    description:
      'Pre páry, ktoré chcú krásny a funkčný svadobný web s praktickým RSVP základom.',
    items: [
      'Svadobný web s kľúčovými informáciami',
      'RSVP s menami hostí, počtom dospelých a detí',
      'Menu možnosti: mäsové, vegetariánske, vegánske, detské',
      'Alergie a stravovacie obmedzenia',
      'Prehľad odpovedí hostí v dashboarde',
      'Zladená pozvánka a QR kartička na stiahnutie',
      'QR kód prepojený so svadobným webom',
    ],
    featured: false,
  },
  {
    name: 'Signature',
    packageType: 'signature',
    price: '249 €',
    label: 'Najobľúbenejšia voľba',
    description:
      'Pre páry, ktoré okrem dizajnu chcú rozšírené RSVP možnosti a viac personalizácie.',
    items: [
      'Všetko z balíka Essential',
      'Rozšírené RSVP s požiadavkami na ubytovanie a dopravu',
      'Manažment ubytovania – požiadavky, hotely, izby a poznámky',
      'Prehľad dopravy a komunikácie s hosťami',
      'Bohatšia personalizácia a max 3 fotografie',
      'Galéria po svadbe',
    ],
    featured: true,
  },
  {
    name: 'Atelier',
    packageType: 'atelier',
    price: 'od 449 €',
    customQuote: true,
    label: 'Kompletné riešenie na mieru',
    description:
      'Bespoke varianta pre výnimočné svadby s plnou tvorbou na mieru.',
    items: [
      'Všetko z balíka Signature',
      'Bespoke plná personalizácia webu',
      'Unikátne guest QR pre hostí alebo skupiny',
      'Individuálne navrhnutý obsah a flow',
    ],
    featured: false,
  },
]

const COLOR_GOLD = '#d4af37'
const COLOR_DARK = '#1a1a1a'
const COLOR_WHITE = '#ffffff'
const COLOR_GREY = '#666'
const COLOR_BORDER = '#e9e9e9'
const SALES_OPEN = process.env.NEXT_PUBLIC_SALES_OPEN === 'true' || process.env.NODE_ENV !== 'production'

const pricingSectionStyle = {
  background: COLOR_WHITE,
  padding: '85px 20px',
}

const pricingInnerStyle = {
  maxWidth: '1140px',
  margin: '0 auto',
  textAlign: 'center',
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

const prelaunchNoticeStyle = {
  maxWidth: '720px',
  margin: '-20px auto 38px',
  padding: '14px 18px',
  border: '1px solid #eadfce',
  background: '#fffaf3',
  color: '#68594d',
  fontSize: '0.9rem',
  lineHeight: 1.6,
}

const selectedDesignStyle = {
  maxWidth: '960px',
  margin: '0 auto 38px',
  padding: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  flexWrap: 'wrap',
  border: '1px solid #ded5c8',
  background: '#f8f4ed',
  textAlign: 'left',
}

const selectedDesignImageStyle = {
  width: '148px',
  height: '94px',
  flex: '0 0 148px',
  objectFit: 'cover',
}

const selectedDesignCopyStyle = {
  minWidth: '190px',
  flex: '1 1 260px',
}

const selectedDesignLabelStyle = {
  margin: '0 0 5px',
  color: '#9a7a54',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '1.8px',
  textTransform: 'uppercase',
}

const selectedDesignTitleStyle = {
  margin: '0 0 4px',
  color: COLOR_DARK,
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '1.45rem',
  fontWeight: 400,
}

const selectedDesignNoteStyle = {
  margin: 0,
  color: COLOR_GREY,
  fontSize: '0.84rem',
  lineHeight: 1.55,
}

const changeDesignLinkStyle = {
  flex: '0 0 auto',
  padding: '11px 15px',
  border: '1px solid #6b5544',
  color: '#4c3b2e',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '1.2px',
  textDecoration: 'none',
  textTransform: 'uppercase',
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
  borderColor: COLOR_GOLD,
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
  background: '#fffcf5',
}

const priceLabelStyle = {
  margin: '0 0 10px',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color: COLOR_GOLD,
  fontWeight: 600,
}

const priceNameStyle = {
  marginTop: 0,
  marginBottom: '6px',
  fontSize: '1.7rem',
  fontFamily: "'Playfair Display', Georgia, serif",
  fontWeight: 400,
}

const priceValueStyle = {
  margin: '0 0 18px',
  color: COLOR_DARK,
  fontSize: '1.15rem',
  fontWeight: 600,
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
  border: 'none',
  cursor: 'pointer',
  fontFamily: "'Montserrat', system-ui, sans-serif",
  boxSizing: 'border-box',
}

export default function PricingSection() {
  const [activeModal, setActiveModal] = useState(null)
  const [selectedDesign, setSelectedDesign] = useState(null)
  const selectedDesignInfo = selectedDesign ? DESIGNS[selectedDesign] : null

  useEffect(() => {
    function syncSelectedDesign() {
      const design = new URLSearchParams(window.location.search).get('design')
      setSelectedDesign(DESIGNS[design] ? design : null)
    }

    syncSelectedDesign()
    window.addEventListener('popstate', syncSelectedDesign)
    return () => window.removeEventListener('popstate', syncSelectedDesign)
  }, [])

  function interestHref(pkg) {
    const subject = `Nezáväzný záujem o balík ${pkg.name}`
    const designLine = selectedDesignInfo ? `Vybraný dizajn: ${selectedDesignInfo.name}\n` : ''
    const body = `Dobrý deň,\n\nmám záujem o balík YesDay ${pkg.name}.\n${designLine}\nProsím, kontaktujte ma s ďalšími informáciami.`
    return `mailto:info.yesdaystudio@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <>
      <section id="cennik" style={pricingSectionStyle}>
        <div style={pricingInnerStyle}>
          <h2 style={sectionHeadingStyle}>Ponuka služieb</h2>
          <p style={sectionIntroStyle}>
            Vyberte si úroveň digitálneho svadobného riešenia podľa toho, či
            chcete elegantný základ alebo plne personalizovaný systém.
          </p>
          {!SALES_OPEN ? (
            <p style={prelaunchNoticeStyle}>
              Online objednávky práve pripravujeme. O balík môžete prejaviť nezáväzný záujem a ozveme sa vám pred spustením.
            </p>
          ) : null}

          {selectedDesignInfo ? (
            <div style={selectedDesignStyle} aria-label={`Vybraný dizajn ${selectedDesignInfo.name}`}>
              <Image
                src={selectedDesignInfo.image}
                alt=""
                width={296}
                height={188}
                style={selectedDesignImageStyle}
              />
              <div style={selectedDesignCopyStyle}>
                <p style={selectedDesignLabelStyle}>Váš vybraný dizajn</p>
                <h3 style={selectedDesignTitleStyle}>{selectedDesignInfo.name}</h3>
                <p style={selectedDesignNoteStyle}>Dizajn zostane zachovaný pri výbere balíka aj v objednávke.</p>
              </div>
              <Link href={`/ukazka?design=${selectedDesign}`} style={changeDesignLinkStyle}>
                Zmeniť dizajn
              </Link>
            </div>
          ) : null}

          <div style={pricingGridStyle}>
            {PACKAGES.map((pkg) => (
              <article
                key={pkg.name}
                style={{
                  ...priceCardStyle,
                  ...(pkg.featured ? priceCardFeaturedStyle : {}),
                }}
              >
                <p style={priceLabelStyle}>{pkg.label}</p>
                <h3 style={priceNameStyle}>{pkg.name}</h3>
                <p style={priceValueStyle}>{pkg.price}</p>
                <p style={priceIntroStyle}>{pkg.description}</p>
                <ul style={priceListStyle}>
                  {pkg.items.map((item) => (
                    <li key={item} style={priceListItemStyle}>
                      {item}
                    </li>
                  ))}
                </ul>
                {pkg.customQuote || !SALES_OPEN ? (
                  <a
                    href={interestHref(pkg)}
                    style={priceButtonStyle}
                  >
                    Mám záujem
                  </a>
                ) : (
                  <button
                    type="button"
                    style={priceButtonStyle}
                    onClick={() =>
                      setActiveModal({
                        name: pkg.name,
                        type: pkg.packageType,
                        price: pkg.price,
                        design: selectedDesign || 'diana',
                      })
                    }
                  >
                    Objednať
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {activeModal && (
        <CheckoutModal
          packageName={activeModal.name}
          packageType={activeModal.type}
          packagePrice={activeModal.price}
          selectedDesign={activeModal.design}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  )
}
