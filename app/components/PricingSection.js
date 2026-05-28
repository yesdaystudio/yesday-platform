'use client'

import { useState } from 'react'
import CheckoutModal from './CheckoutModal'

const PACKAGES = [
  {
    name: 'Essential',
    packageType: 'essential',
    label: 'Elegantný digitálny základ',
    description:
      'Pre páry, ktoré chcú krásny a funkčný svadobný web s praktickým RSVP základom.',
    items: [
      'RSVP s menami hostí, počtom dospelých a detí',
      'Menu možnosti: mäsové, vegetariánske, vegánske, detské',
      'Alergie a stravovacie obmedzenia',
      'Svadobný web s kľúčovými informáciami',
      'Zdieľaný QR kód na web',
    ],
    featured: false,
  },
  {
    name: 'Signature',
    packageType: 'signature',
    label: 'Najobľúbenejšia voľba',
    description:
      'Pre páry, ktoré okrem dizajnu chcú rozšírené RSVP možnosti a viac personalizácie.',
    items: [
      'Všetko z balíka Essential',
      'Obšírnejší RSVP formulár',
      'Manažment ubytovania – priradenie ubytovania hosťom (už čoskoro)',
      'Personalizované QR kódy pre hostí (už čoskoro)',
      'Bohatšia personalizácia a max 3 fotografie',
      'Galéria po svadbe',
    ],
    featured: true,
  },
  {
    name: 'Atelier',
    packageType: 'atelier',
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
  marginBottom: '14px',
  fontSize: '1.7rem',
  fontFamily: "'Playfair Display', Georgia, serif",
  fontWeight: 400,
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

  return (
    <>
      <section id="cennik" style={pricingSectionStyle}>
        <div style={pricingInnerStyle}>
          <h2 style={sectionHeadingStyle}>Ponuka služieb</h2>
          <p style={sectionIntroStyle}>
            Vyberte si úroveň digitálneho svadobného riešenia podľa toho, či
            chcete elegantný základ alebo plne personalizovaný systém.
          </p>

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
                <p style={priceIntroStyle}>{pkg.description}</p>
                <ul style={priceListStyle}>
                  {pkg.items.map((item) => (
                    <li key={item} style={priceListItemStyle}>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  style={priceButtonStyle}
                  onClick={() =>
                    setActiveModal({
                      name: pkg.name,
                      type: pkg.packageType,
                    })
                  }
                >
                  Objednať
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {activeModal && (
        <CheckoutModal
          packageName={activeModal.name}
          packageType={activeModal.type}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  )
}
